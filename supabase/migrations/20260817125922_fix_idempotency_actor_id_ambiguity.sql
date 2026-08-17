-- PL/pgSQL resolves an unqualified identifier as ambiguous when it can refer to
-- both a local variable and a table column. Keep the public idempotency wrappers
-- and their private implementations explicit by reserving v_actor_id for the
-- authenticated caller and actor_id for persisted audit columns.

create or replace function public.record_member_transaction_once(
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
  actor_profile public.profiles%rowtype;
  business_row public.businesses%rowtype;
  member_profile public.profiles%rowtype;
  existing_transaction public.member_transactions%rowtype;
  existing_receipt_transaction public.member_transactions%rowtype;
  inserted_transaction public.member_transactions%rowtype;
  purchase_amount_value numeric(12,2);
  receipt_number_value text;
  reward_value_value numeric(12,2);
  points_awarded_value integer;
  commission_amount_value numeric(12,2);
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_client_request_id is not null then
    select transaction_row.* into existing_transaction
    from public.member_transactions transaction_row
    where transaction_row.recorded_by = v_actor_id
      and transaction_row.client_request_id = p_client_request_id
    limit 1;

    if found then
      return existing_transaction;
    end if;
  end if;

  select profile_row.* into actor_profile
  from public.profiles profile_row
  where profile_row.id = v_actor_id;

  if actor_profile.role not in ('business-owner', 'business-staff')
    or actor_profile.business_id is null then
    raise exception 'Permission denied';
  end if;

  select business.* into business_row
  from public.businesses business
  where business.id = actor_profile.business_id
    and business.active = true
  for share;

  if not found then
    raise exception 'Business not found.';
  end if;

  if not exists (
    select 1
    from public.program_memberships membership
    where membership.program_id = business_row.program_id
      and membership.profile_id = v_actor_id
      and membership.role::text = actor_profile.role::text
      and membership.business_id = business_row.id
      and membership.status = 'active'
  ) then
    raise exception 'Permission denied';
  end if;

  select profile_row.* into member_profile
  from public.profiles profile_row
  where profile_row.member_qr_token = p_member_qr_token
    and profile_row.role = 'customer';

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

  perform public.assert_member_verified(member_profile.id);

  if p_purchase_amount is null or p_purchase_amount <= 0 then
    raise exception 'Purchase amount must be greater than 0.';
  end if;

  receipt_number_value := nullif(trim(coalesce(p_receipt_number, '')), '');
  if receipt_number_value is null or length(receipt_number_value) < 3 then
    raise exception 'Receipt or bill number is required.';
  end if;

  select transaction_row.* into existing_receipt_transaction
  from public.member_transactions transaction_row
  where transaction_row.program_id = business_row.program_id
    and transaction_row.business_id = business_row.id
    and lower(trim(transaction_row.receipt_number)) = lower(receipt_number_value)
  limit 1;

  if found then
    raise exception 'This receipt or bill number has already been recorded.';
  end if;

  purchase_amount_value := round(p_purchase_amount::numeric, 2);
  reward_value_value := round((purchase_amount_value * business_row.reward_rate_percent / 100)::numeric, 2);
  points_awarded_value := floor(reward_value_value);
  commission_amount_value := round((purchase_amount_value * business_row.commission_rate_percent / 100)::numeric, 2);

  insert into public.member_transactions (
    program_id,
    profile_id,
    business_id,
    purchase_amount,
    receipt_number,
    reward_rate_percent,
    reward_value,
    points_awarded,
    commission_rate_percent,
    commission_amount,
    recorded_by,
    note,
    client_request_id
  )
  values (
    business_row.program_id,
    member_profile.id,
    business_row.id,
    purchase_amount_value,
    receipt_number_value,
    business_row.reward_rate_percent,
    reward_value_value,
    points_awarded_value,
    business_row.commission_rate_percent,
    commission_amount_value,
    v_actor_id,
    nullif(trim(coalesce(p_note, '')), ''),
    p_client_request_id
  )
  returning * into inserted_transaction;

  insert into public.reward_balances (program_id, profile_id)
  values (business_row.program_id, member_profile.id)
  on conflict (program_id, profile_id) do nothing;

  update public.reward_balances
  set points = points + points_awarded_value,
      updated_at = now()
  where program_id = business_row.program_id
    and profile_id = member_profile.id;

  insert into public.activities (
    program_id,
    profile_id,
    business_id,
    type,
    title,
    description,
    points,
    status
  )
  values (
    business_row.program_id,
    member_profile.id,
    business_row.id,
    'earned',
    format(
      'Purchase at %s - %s %s',
      business_row.name,
      business_row.currency,
      to_char(purchase_amount_value, 'FM999999990.00')
    ),
    format(
      '%s %s reward value issued from receipt %s.',
      business_row.currency,
      to_char(reward_value_value, 'FM999999990.00'),
      receipt_number_value
    ),
    points_awarded_value,
    'posted'
  );

  insert into public.admin_logs (
    program_id,
    actor_id,
    actor_name,
    action,
    details
  )
  values (
    business_row.program_id,
    v_actor_id,
    coalesce(actor_profile.full_name, 'Business staff'),
    'Member QR transaction recorded',
    format(
      'Recorded receipt %s for %s %s for %s at %s. Awarded %s points. Commission owed: %s %s.',
      receipt_number_value,
      business_row.currency,
      to_char(purchase_amount_value, 'FM999999990.00'),
      member_profile.full_name,
      business_row.name,
      points_awarded_value,
      business_row.currency,
      to_char(commission_amount_value, 'FM999999990.00')
    )
  );

  return inserted_transaction;
exception
  when unique_violation then
    if p_client_request_id is not null then
      select transaction_row.* into existing_transaction
      from public.member_transactions transaction_row
      where transaction_row.recorded_by = v_actor_id
        and transaction_row.client_request_id = p_client_request_id
      limit 1;

      if found then
        return existing_transaction;
      end if;
    end if;

    raise exception 'This receipt or bill number has already been recorded.';
end;
$$;

revoke all on function public.record_member_transaction_once(text, numeric, text, text, uuid)
  from public, anon, authenticated, service_role;

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

create or replace function public.redeem_gift_card_once(
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
  actor_profile public.profiles%rowtype;
  business_row public.businesses%rowtype;
  card_row public.gift_cards%rowtype;
  updated_card public.gift_cards%rowtype;
  inserted_transaction public.member_transactions%rowtype;
  existing_receipt_transaction public.member_transactions%rowtype;
  catalog_title text;
  catalog_value_label text;
  receipt_number_value text;
  original_bill_value numeric(12,2);
  gift_card_amount_value numeric(12,2);
  bill_after_gift_card_value numeric(12,2);
  tax_charge_value numeric(12,2);
  service_charge_value numeric(12,2);
  total_before_gift_card_value numeric(12,2);
  final_bill_value numeric(12,2);
  purchase_amount_value numeric(12,2);
  reward_value_value numeric(12,2);
  points_awarded_value integer;
  commission_amount_value numeric(12,2);
  available_balance_value numeric(12,2);
  remaining_balance_after_value numeric(12,2);
begin
  if v_actor_id is null then raise exception 'Authentication required'; end if;

  select profile_row.* into actor_profile
  from public.profiles profile_row
  where profile_row.id = v_actor_id;
  if not found then raise exception 'Redeeming profile not found'; end if;

  select business.* into business_row
  from public.businesses business
  where business.id = p_business_id
    and business.active = true;

  if not found then raise exception 'Business not found'; end if;

  if actor_profile.role <> 'platform-admin' and (
    actor_profile.role not in ('business-owner', 'business-staff')
    or actor_profile.business_id is null
    or actor_profile.business_id <> p_business_id
    or not exists (
      select 1
      from public.program_memberships membership
      where membership.program_id = business_row.program_id
        and membership.profile_id = v_actor_id
        and membership.role::text = actor_profile.role::text
        and membership.business_id = business_row.id
        and membership.status = 'active'
    )
  ) then
    raise exception 'Permission denied';
  end if;

  select card.* into card_row
  from public.gift_cards card
  where card.id = p_gift_card_id
  for update;

  if not found then raise exception 'Gift card not found'; end if;
  if card_row.program_id <> business_row.program_id then raise exception 'Gift card belongs to a different rewards program'; end if;
  if card_row.business_id <> p_business_id then raise exception 'Gift card belongs to a different business'; end if;
  if card_row.status = 'redeemed' then raise exception 'Gift card has no remaining balance'; end if;
  if card_row.status <> 'active' then raise exception 'Gift card is not active'; end if;

  select catalog.title, catalog.value_label
    into catalog_title, catalog_value_label
  from public.gift_card_catalog catalog
  where catalog.id = card_row.catalog_id
    and catalog.program_id = business_row.program_id;

  available_balance_value := round(coalesce(
    card_row.remaining_balance,
    card_row.remaining_value_amount,
    card_row.initial_balance,
    card_row.original_value_amount,
    public.gift_card_face_value_from_label(catalog_value_label),
    0
  )::numeric, 2);

  if available_balance_value <= 0 then
    update public.gift_cards card
    set status = 'redeemed',
        remaining_balance = 0,
        remaining_value_amount = 0,
        redeemed_at = coalesce(card.redeemed_at, now()),
        redeemed_by = coalesce(card.redeemed_by, v_actor_id),
        redeemed_at_business = coalesce(card.redeemed_at_business, p_business_id)
    where card.id = card_row.id;
    raise exception 'Gift card has no remaining balance';
  end if;

  if card_row.expires_at is not null and now() >= card_row.expires_at then
    update public.gift_cards card
    set status = 'expired'
    where card.id = card_row.id;
    insert into public.gift_card_events (program_id, gift_card_id, event_type, actor_id, metadata)
    values (
      business_row.program_id,
      card_row.id,
      'expired',
      v_actor_id,
      pg_catalog.jsonb_build_object('reason', 'redeem_attempt_after_expiry')
    );
    raise exception 'Gift card has expired';
  end if;

  if p_original_bill is not null then
    if p_original_bill <= 0 then
      raise exception 'Original bill must be greater than 0.';
    end if;

    receipt_number_value := nullif(trim(coalesce(p_receipt_number, '')), '');
    if receipt_number_value is null or length(receipt_number_value) < 3 then
      raise exception 'Receipt or bill number is required.';
    end if;

    select transaction_row.* into existing_receipt_transaction
    from public.member_transactions transaction_row
    where transaction_row.program_id = business_row.program_id
      and transaction_row.business_id = business_row.id
      and lower(trim(transaction_row.receipt_number)) = lower(receipt_number_value)
    limit 1;

    if found then
      raise exception 'This receipt or bill number has already been recorded.';
    end if;

    original_bill_value := round(p_original_bill::numeric, 2);
    tax_charge_value := case
      when coalesce(business_row.tax_included_in_bill, false)
        then round((original_bill_value * coalesce(business_row.tax_rate, 0))::numeric, 2)
      else 0
    end;
    service_charge_value := case
      when coalesce(business_row.service_charge_enabled, false)
        then round((original_bill_value * coalesce(business_row.service_charge_rate, 0))::numeric, 2)
      else 0
    end;
    total_before_gift_card_value := round((original_bill_value + tax_charge_value + service_charge_value)::numeric, 2);
    gift_card_amount_value := round(least(
      greatest(coalesce(p_gift_card_amount, total_before_gift_card_value), 0),
      total_before_gift_card_value,
      available_balance_value
    )::numeric, 2);
    bill_after_gift_card_value := round(greatest(original_bill_value - gift_card_amount_value, 0)::numeric, 2);
    final_bill_value := round(greatest(total_before_gift_card_value - gift_card_amount_value, 0)::numeric, 2);
  else
    original_bill_value := null;
    gift_card_amount_value := round(least(
      greatest(coalesce(p_gift_card_amount, available_balance_value), 0),
      available_balance_value
    )::numeric, 2);
    bill_after_gift_card_value := null;
    tax_charge_value := 0;
    service_charge_value := 0;
    total_before_gift_card_value := null;
    final_bill_value := null;
  end if;

  if gift_card_amount_value <= 0 then
    raise exception 'Gift card amount must be greater than 0.';
  end if;

  remaining_balance_after_value := round(greatest(available_balance_value - gift_card_amount_value, 0)::numeric, 2);

  update public.gift_cards card
  set status = case
        when remaining_balance_after_value <= 0 then 'redeemed'::public.gift_card_status
        else 'active'::public.gift_card_status
      end,
      original_value_amount = coalesce(
        card.original_value_amount,
        card.initial_balance,
        public.gift_card_face_value_from_label(catalog_value_label),
        available_balance_value
      ),
      initial_balance = coalesce(
        card.initial_balance,
        card.original_value_amount,
        public.gift_card_face_value_from_label(catalog_value_label),
        available_balance_value
      ),
      remaining_value_amount = remaining_balance_after_value,
      remaining_balance = remaining_balance_after_value,
      redeemed_at = case when remaining_balance_after_value <= 0 then now() else null end,
      redeemed_by = case when remaining_balance_after_value <= 0 then v_actor_id else null end,
      redeemed_at_business = case when remaining_balance_after_value <= 0 then p_business_id else null end,
      updated_at = now()
  where card.id = p_gift_card_id
    and card.program_id = business_row.program_id
    and card.status = 'active'
  returning card.* into updated_card;

  if not found then raise exception 'Gift card could not be updated'; end if;

  insert into public.gift_card_events (program_id, gift_card_id, event_type, actor_id, metadata)
  values (
    business_row.program_id,
    updated_card.id,
    'redeemed',
    v_actor_id,
    pg_catalog.jsonb_build_object(
      'business_id', p_business_id,
      'original_bill', original_bill_value,
      'gift_card_amount', gift_card_amount_value,
      'bill_after_gift_card', bill_after_gift_card_value,
      'tax_added', tax_charge_value,
      'service_charge_added', service_charge_value,
      'total_before_gift_card', total_before_gift_card_value,
      'final_bill', final_bill_value,
      'remaining_balance_before', available_balance_value,
      'remaining_balance_after', remaining_balance_after_value,
      'receipt_number', receipt_number_value
    )
  );

  if original_bill_value is not null and original_bill_value > 0 then
    purchase_amount_value := original_bill_value;
    reward_value_value := round((purchase_amount_value * business_row.reward_rate_percent / 100)::numeric, 2);
    points_awarded_value := floor(reward_value_value);
    commission_amount_value := round((purchase_amount_value * business_row.commission_rate_percent / 100)::numeric, 2);

    insert into public.member_transactions (
      program_id,
      profile_id,
      business_id,
      purchase_amount,
      receipt_number,
      reward_rate_percent,
      reward_value,
      points_awarded,
      commission_rate_percent,
      commission_amount,
      recorded_by,
      note,
      client_request_id
    )
    values (
      business_row.program_id,
      updated_card.customer_id,
      business_row.id,
      purchase_amount_value,
      receipt_number_value,
      business_row.reward_rate_percent,
      reward_value_value,
      points_awarded_value,
      business_row.commission_rate_percent,
      commission_amount_value,
      v_actor_id,
      format(
        'Gift card code: %s. Gift card value: %s. Gift card remaining balance: %s. Original receipt total: %s. Bill after gift card: %s. Tax added: %s. Service charge added: %s. Total before gift card: %s. Final bill after gift card: %s.',
        updated_card.code,
        to_char(gift_card_amount_value, 'FM999999990.00'),
        to_char(remaining_balance_after_value, 'FM999999990.00'),
        to_char(original_bill_value, 'FM999999990.00'),
        to_char(bill_after_gift_card_value, 'FM999999990.00'),
        to_char(tax_charge_value, 'FM999999990.00'),
        to_char(service_charge_value, 'FM999999990.00'),
        to_char(total_before_gift_card_value, 'FM999999990.00'),
        to_char(final_bill_value, 'FM999999990.00')
      ),
      p_client_request_id
    )
    returning * into inserted_transaction;

    insert into public.reward_balances (program_id, profile_id)
    values (business_row.program_id, updated_card.customer_id)
    on conflict (program_id, profile_id) do nothing;

    update public.reward_balances
    set points = points + points_awarded_value,
        updated_at = now()
    where program_id = business_row.program_id
      and profile_id = updated_card.customer_id;

    insert into public.activities (
      program_id,
      profile_id,
      business_id,
      type,
      title,
      description,
      points,
      status
    )
    values (
      business_row.program_id,
      updated_card.customer_id,
      business_row.id,
      'earned',
      format(
        'Purchase at %s - %s %s',
        business_row.name,
        business_row.currency,
        to_char(purchase_amount_value, 'FM999999990.00')
      ),
      format(
        '%s %s reward value issued from receipt %s after gift card %s.',
        business_row.currency,
        to_char(reward_value_value, 'FM999999990.00'),
        receipt_number_value,
        updated_card.code
      ),
      points_awarded_value,
      'posted'
    );
  end if;

  insert into public.activities (
    program_id,
    profile_id,
    business_id,
    type,
    title,
    description,
    points,
    status
  )
  values (
    business_row.program_id,
    updated_card.customer_id,
    updated_card.business_id,
    'gift_card_redeemed',
    case when remaining_balance_after_value <= 0 then 'Gift card redeemed' else 'Gift card used' end,
    format(
      '%s. Remaining balance: %s',
      coalesce(catalog_title, updated_card.code),
      to_char(remaining_balance_after_value, 'FM999999990.00')
    ),
    0,
    'posted'
  );

  return updated_card;
end;
$$;

revoke all on function public.redeem_gift_card_once(uuid, uuid, numeric, text, numeric, uuid)
  from public, anon, authenticated, service_role;

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

create or replace function public.redeem_reward_once(
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
  actor_profile public.profiles%rowtype;
  business_row public.businesses%rowtype;
  reward_row public.rewards%rowtype;
  balance_row public.reward_balances%rowtype;
  existing_redemption public.redemptions%rowtype;
  inserted_redemption public.redemptions%rowtype;
begin
  if v_actor_id is null then raise exception 'Authentication required'; end if;
  if p_reward_id is null then raise exception 'Reward not found.'; end if;
  if p_pickup_window not in ('Now', 'Within 30 mins', 'Later today') then
    raise exception 'Invalid pickup window.';
  end if;

  select profile_row.* into actor_profile
  from public.profiles profile_row
  where profile_row.id = v_actor_id
    and profile_row.role = 'customer';
  if not found then raise exception 'Only customer accounts can redeem rewards.'; end if;

  select reward.* into reward_row
  from public.rewards reward
  where reward.id = p_reward_id
  for update;
  if not found then raise exception 'Reward not found.'; end if;

  select business.* into business_row
  from public.businesses business
  where business.id = reward_row.business_id
    and business.program_id = reward_row.program_id
    and business.active = true;
  if not found then raise exception 'Reward business is not active in this rewards program.'; end if;

  if not exists (
    select 1
    from public.program_memberships membership
    where membership.program_id = reward_row.program_id
      and membership.profile_id = v_actor_id
      and membership.role = 'member'
      and membership.status = 'active'
  ) then
    raise exception 'Customer is not an active member of this rewards program';
  end if;

  if not exists (
    select 1
    from public.memberships membership
    where membership.program_id = reward_row.program_id
      and membership.profile_id = v_actor_id
      and membership.status = 'active'
      and membership.current_period_end > now()
  ) then
    raise exception 'membership_required';
  end if;

  if p_client_request_id is not null then
    select redemption.* into existing_redemption
    from public.redemptions redemption
    where redemption.program_id = reward_row.program_id
      and redemption.profile_id = v_actor_id
      and redemption.client_request_id = p_client_request_id
    limit 1;
    if found then return existing_redemption; end if;
  end if;

  if reward_row.inventory <= 0 then
    raise exception 'That reward is currently out of stock.';
  end if;

  insert into public.reward_balances (program_id, profile_id)
  values (reward_row.program_id, v_actor_id)
  on conflict (program_id, profile_id) do nothing;

  select balance.* into balance_row
  from public.reward_balances balance
  where balance.program_id = reward_row.program_id
    and balance.profile_id = v_actor_id
  for update;

  if balance_row.points < reward_row.points_cost then
    raise exception 'You do not have enough XP for this reward yet.';
  end if;

  update public.rewards reward
  set inventory = reward.inventory - 1
  where reward.id = reward_row.id
    and reward.program_id = reward_row.program_id
    and reward.inventory > 0;
  if not found then raise exception 'That reward is currently out of stock.'; end if;

  update public.reward_balances balance
  set points = balance.points - reward_row.points_cost,
      updated_at = now()
  where balance.program_id = reward_row.program_id
    and balance.profile_id = v_actor_id
    and balance.points >= reward_row.points_cost;
  if not found then raise exception 'You do not have enough XP for this reward yet.'; end if;

  insert into public.redemptions (
    program_id, profile_id, reward_id, reward_title, points_cost,
    pickup_window, notes, status, client_request_id
  )
  values (
    reward_row.program_id,
    v_actor_id,
    reward_row.id,
    reward_row.title,
    reward_row.points_cost,
    p_pickup_window,
    nullif(trim(coalesce(p_notes, '')), ''),
    'ready',
    p_client_request_id
  )
  returning * into inserted_redemption;

  insert into public.activities (
    program_id, profile_id, business_id, type, title, description, points, status
  )
  values (
    reward_row.program_id,
    v_actor_id,
    reward_row.business_id,
    'redeemed',
    format('%s redeemed', reward_row.title),
    case
      when nullif(trim(coalesce(p_notes, '')), '') is null
        then format('%s pickup selected', p_pickup_window)
      else format(
        '%s pickup selected - %s',
        p_pickup_window,
        nullif(trim(coalesce(p_notes, '')), '')
      )
    end,
    -reward_row.points_cost,
    'posted'
  );

  insert into public.admin_logs (program_id, actor_id, actor_name, action, details)
  values (
    reward_row.program_id,
    v_actor_id,
    coalesce(actor_profile.full_name, 'Customer redemption'),
    'Reward redeemed',
    format(
      'Reward %s redeemed at business %s for %s XP.',
      reward_row.title,
      reward_row.business_id,
      reward_row.points_cost
    )
  );

  return inserted_redemption;
exception
  when unique_violation then
    if p_client_request_id is not null and reward_row.program_id is not null then
      select redemption.* into existing_redemption
      from public.redemptions redemption
      where redemption.program_id = reward_row.program_id
        and redemption.profile_id = v_actor_id
        and redemption.client_request_id = p_client_request_id
      limit 1;
      if found then return existing_redemption; end if;
    end if;
    raise;
end;
$$;

revoke all on function public.redeem_reward_once(uuid, text, text, uuid)
  from public, anon, authenticated, service_role;

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
