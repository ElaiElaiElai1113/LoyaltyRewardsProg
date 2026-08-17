-- Composite-returning functions used as scalar SELECT expressions are not
-- expanded into a declared %rowtype target. PostgreSQL instead attempts to
-- coerce the complete composite value into the target row's first uuid field.
-- Keep the existing validation and idempotency guards while selecting the
-- private function results as rows.

create or replace function public.record_member_transaction(
  p_member_qr_token text,
  p_purchase_amount numeric,
  p_receipt_number text,
  p_note text default null,
  p_client_request_id uuid default null
)
returns public.member_transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  business_row public.businesses%rowtype;
  member_profile public.profiles%rowtype;
  result_transaction public.member_transactions%rowtype;
  member_qr_token_value text := trim(coalesce(p_member_qr_token, ''));
  purchase_amount_value numeric(12,2);
  receipt_number_value text := nullif(trim(coalesce(p_receipt_number, '')), '');
  note_value text := nullif(trim(coalesce(p_note, '')), '');
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  select business.*
    into business_row
  from public.profiles actor_profile
  join public.businesses business
    on business.id = actor_profile.business_id
   and business.active = true
  where actor_profile.id = v_actor_id
    and actor_profile.role in ('business-owner', 'business-staff')
    and exists (
      select 1
      from public.program_memberships membership
      where membership.program_id = business.program_id
        and membership.profile_id = v_actor_id
        and membership.role::text = actor_profile.role::text
        and membership.business_id = business.id
        and membership.status = 'active'
    );

  if not found then
    raise exception 'Permission denied';
  end if;

  select profile.*
    into member_profile
  from public.profiles profile
  where profile.member_qr_token = member_qr_token_value
    and profile.role = 'customer';

  if not found then
    raise exception 'Member not found.';
  end if;

  if not exists (
    select 1
    from public.program_memberships membership
    where membership.program_id = business_row.program_id
      and membership.profile_id = member_profile.id
      and membership.role = 'member'
      and membership.status = 'active'
  ) then
    raise exception 'Customer is not an active member of this rewards program';
  end if;

  if p_purchase_amount is null or p_purchase_amount <= 0 then
    raise exception 'Purchase amount must be greater than 0.';
  end if;
  purchase_amount_value := round(p_purchase_amount::numeric, 2);

  if receipt_number_value is null or length(receipt_number_value) < 3 then
    raise exception 'Receipt or bill number is required.';
  end if;

  if p_client_request_id is not null then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        v_actor_id::text || ':' || p_client_request_id::text,
        0
      )
    );

    select member_transaction.*
      into result_transaction
    from public.member_transactions member_transaction
    where member_transaction.recorded_by = v_actor_id
      and member_transaction.client_request_id = p_client_request_id
      and member_transaction.program_id = business_row.program_id
      and member_transaction.business_id = business_row.id
      and member_transaction.profile_id = member_profile.id
      and member_transaction.purchase_amount = purchase_amount_value
      and lower(trim(member_transaction.receipt_number)) = lower(receipt_number_value)
      and member_transaction.note is not distinct from note_value
      and not exists (
        select 1
        from public.gift_card_events event
        where event.actor_id = v_actor_id
          and event.metadata ->> 'client_request_id' = p_client_request_id::text
      )
    limit 1;

    if found then
      return result_transaction;
    end if;

    if exists (
      select 1
      from public.member_transactions member_transaction
      where member_transaction.recorded_by = v_actor_id
        and member_transaction.client_request_id = p_client_request_id
      union all
      select 1
      from public.gift_card_events event
      where event.actor_id = v_actor_id
        and event.metadata ->> 'client_request_id' = p_client_request_id::text
    ) then
      raise exception 'This request was already used for a different transaction.';
    end if;
  end if;

  select transaction_row.*
    into result_transaction
  from public.record_member_transaction_once(
    member_qr_token_value,
    purchase_amount_value,
    receipt_number_value,
    note_value,
    p_client_request_id
  ) as transaction_row;

  return result_transaction;
end;
$$;

revoke all on function public.record_member_transaction(text, numeric, text, text, uuid)
  from public, anon, service_role;
grant execute on function public.record_member_transaction(text, numeric, text, text, uuid)
  to authenticated;

create or replace function public.redeem_gift_card(
  p_gift_card_id uuid,
  p_business_id uuid,
  p_original_bill numeric default null,
  p_receipt_number text default null,
  p_gift_card_amount numeric default null,
  p_client_request_id uuid default null
)
returns public.gift_cards
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  result_card public.gift_cards%rowtype;
  request_was_used boolean := false;
  redemption_event_id uuid;
  requested_original_bill_value numeric(12,2) := case
    when p_original_bill is null then null
    else round(p_original_bill::numeric, 2)
  end;
  requested_receipt_number_value text := nullif(trim(coalesce(p_receipt_number, '')), '');
  requested_gift_card_amount_value numeric(12,2) := case
    when p_gift_card_amount is null then null
    else round(p_gift_card_amount::numeric, 2)
  end;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.profiles actor_profile
    join public.businesses business_row
      on business_row.id = p_business_id
     and business_row.active = true
    where actor_profile.id = v_actor_id
      and (
        actor_profile.role = 'platform-admin'
        or (
          actor_profile.role in ('business-owner', 'business-staff')
          and actor_profile.business_id = business_row.id
          and exists (
            select 1
            from public.program_memberships membership
            where membership.program_id = business_row.program_id
              and membership.profile_id = v_actor_id
              and membership.role::text = actor_profile.role::text
              and membership.business_id = business_row.id
              and membership.status = 'active'
          )
        )
      )
  ) then
    raise exception 'Permission denied';
  end if;

  if p_client_request_id is not null then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        v_actor_id::text || ':' || p_client_request_id::text,
        0
      )
    );

    select card.*
      into result_card
    from public.gift_card_events event
    join public.gift_cards card on card.id = event.gift_card_id
    where event.actor_id = v_actor_id
      and event.event_type = 'redeemed'
      and event.metadata ->> 'client_request_id' = p_client_request_id::text
      and event.gift_card_id = p_gift_card_id
      and event.metadata ->> 'business_id' = p_business_id::text
      and case
        when requested_original_bill_value is null then
          event.metadata ? 'requested_original_bill'
          and pg_catalog.jsonb_typeof(event.metadata -> 'requested_original_bill') = 'null'
        when pg_catalog.jsonb_typeof(event.metadata -> 'requested_original_bill') = 'number' then
          round((event.metadata ->> 'requested_original_bill')::numeric, 2) = requested_original_bill_value
        else false
      end
      and case
        when requested_receipt_number_value is null then
          event.metadata ? 'requested_receipt_number'
          and pg_catalog.jsonb_typeof(event.metadata -> 'requested_receipt_number') = 'null'
        when pg_catalog.jsonb_typeof(event.metadata -> 'requested_receipt_number') = 'string' then
          lower(trim(event.metadata ->> 'requested_receipt_number')) = lower(requested_receipt_number_value)
        else false
      end
      and case
        when requested_gift_card_amount_value is null then
          event.metadata ? 'requested_gift_card_amount'
          and pg_catalog.jsonb_typeof(event.metadata -> 'requested_gift_card_amount') = 'null'
        when pg_catalog.jsonb_typeof(event.metadata -> 'requested_gift_card_amount') = 'number' then
          round((event.metadata ->> 'requested_gift_card_amount')::numeric, 2) = requested_gift_card_amount_value
        else false
      end
    limit 1;

    if found then
      return result_card;
    end if;

    select exists (
      select 1
      from public.member_transactions member_transaction
      where member_transaction.recorded_by = v_actor_id
        and member_transaction.client_request_id = p_client_request_id
      union all
      select 1
      from public.gift_card_events event
      where event.actor_id = v_actor_id
        and event.metadata ->> 'client_request_id' = p_client_request_id::text
    ) into request_was_used;

    if request_was_used then
      raise exception 'This request was already used for a different transaction.';
    end if;
  end if;

  select card_row.*
    into result_card
  from public.redeem_gift_card_once(
    p_gift_card_id,
    p_business_id,
    requested_original_bill_value,
    requested_receipt_number_value,
    requested_gift_card_amount_value,
    p_client_request_id
  ) as card_row;

  if p_client_request_id is not null then
    select event.id
      into redemption_event_id
    from public.gift_card_events event
    where event.gift_card_id = p_gift_card_id
      and event.actor_id = v_actor_id
      and event.event_type = 'redeemed'
      and event.metadata ->> 'business_id' = p_business_id::text
      and not (event.metadata ? 'client_request_id')
      and case
        when requested_original_bill_value is null then
          pg_catalog.jsonb_typeof(event.metadata -> 'original_bill') = 'null'
        when pg_catalog.jsonb_typeof(event.metadata -> 'original_bill') = 'number' then
          round((event.metadata ->> 'original_bill')::numeric, 2) = requested_original_bill_value
        else false
      end
      and case
        when requested_original_bill_value is null then
          pg_catalog.jsonb_typeof(event.metadata -> 'receipt_number') = 'null'
        when requested_receipt_number_value is null then
          pg_catalog.jsonb_typeof(event.metadata -> 'receipt_number') = 'null'
        when pg_catalog.jsonb_typeof(event.metadata -> 'receipt_number') = 'string' then
          lower(trim(event.metadata ->> 'receipt_number')) = lower(requested_receipt_number_value)
        else false
      end
      and round((event.metadata ->> 'remaining_balance_after')::numeric, 2)
        = round(coalesce(result_card.remaining_balance, result_card.remaining_value_amount, 0)::numeric, 2)
    order by event.created_at desc
    limit 1;

    if redemption_event_id is null then
      raise exception 'Gift card redemption audit event was not recorded.';
    end if;

    update public.gift_card_events event
    set metadata = event.metadata || pg_catalog.jsonb_build_object(
      'client_request_id', p_client_request_id::text,
      'requested_original_bill', coalesce(
        pg_catalog.to_jsonb(requested_original_bill_value),
        'null'::jsonb
      ),
      'requested_receipt_number', coalesce(
        pg_catalog.to_jsonb(requested_receipt_number_value),
        'null'::jsonb
      ),
      'requested_gift_card_amount', coalesce(
        pg_catalog.to_jsonb(requested_gift_card_amount_value),
        'null'::jsonb
      )
    )
    where event.id = redemption_event_id;
  end if;

  return result_card;
end;
$$;

revoke all on function public.redeem_gift_card(uuid, uuid, numeric, text, numeric, uuid)
  from public, anon, service_role;
grant execute on function public.redeem_gift_card(uuid, uuid, numeric, text, numeric, uuid)
  to authenticated;

create or replace function public.redeem_reward(
  p_reward_id uuid,
  p_pickup_window text,
  p_notes text default null,
  p_client_request_id uuid default null
)
returns public.redemptions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  requested_program_id uuid;
  normalized_pickup_window text := trim(coalesce(p_pickup_window, ''));
  normalized_notes text := nullif(trim(coalesce(p_notes, '')), '');
  result_redemption public.redemptions%rowtype;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_client_request_id is not null then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        v_actor_id::text || ':' || p_client_request_id::text,
        0
      )
    );
  end if;

  begin
    select redemption_row.*
      into result_redemption
    from public.redeem_reward_once(
      p_reward_id,
      normalized_pickup_window,
      normalized_notes,
      p_client_request_id
    ) as redemption_row;
  exception
    when unique_violation then
      if p_client_request_id is not null
        and exists (
          select 1
          from public.redemptions redemption_row
          where redemption_row.profile_id = v_actor_id
            and redemption_row.client_request_id = p_client_request_id
        )
      then
        raise exception 'This request was already used for a different reward redemption.';
      end if;
      raise;
  end;

  select reward_row.program_id
    into requested_program_id
  from public.rewards reward_row
  where reward_row.id = p_reward_id;

  if requested_program_id is null then
    raise exception 'Reward not found.';
  end if;

  if result_redemption.profile_id <> v_actor_id
    or result_redemption.program_id <> requested_program_id
    or result_redemption.reward_id <> p_reward_id
    or trim(result_redemption.pickup_window) <> normalized_pickup_window
    or nullif(trim(coalesce(result_redemption.notes, '')), '')
      is distinct from normalized_notes
  then
    raise exception 'This request was already used for a different reward redemption.';
  end if;

  return result_redemption;
end;
$$;

revoke all on function public.redeem_reward(uuid, text, text, uuid)
  from public, anon, service_role;
grant execute on function public.redeem_reward(uuid, text, text, uuid)
  to authenticated;

notify pgrst, 'reload schema';
