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
set search_path = public
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
    select * into existing_transaction
    from public.member_transactions
    where recorded_by = v_actor_id
      and client_request_id = p_client_request_id
    limit 1;

    if found then
      return existing_transaction;
    end if;
  end if;

  select * into actor_profile
  from public.profiles
  where id = v_actor_id;

  if actor_profile.role not in ('business-owner', 'business-staff')
    or actor_profile.business_id is null then
    raise exception 'Permission denied';
  end if;

  select * into business_row
  from public.businesses
  where id = actor_profile.business_id
    and active = true
  for share;

  if not found then
    raise exception 'Business not found.';
  end if;

  if not exists (
    select 1
    from public.program_memberships pm
    where pm.program_id = business_row.program_id
      and pm.profile_id = v_actor_id
      and pm.role::text = actor_profile.role::text
      and pm.business_id = business_row.id
      and pm.status = 'active'
  ) then
    raise exception 'Permission denied';
  end if;

  select * into member_profile
  from public.profiles
  where member_qr_token = p_member_qr_token
    and role = 'customer';

  if not found then
    raise exception 'Member not found.';
  end if;

  if not exists (
    select 1
    from public.program_memberships pm
    where pm.program_id = business_row.program_id
      and pm.profile_id = member_profile.id
      and pm.role = 'member'
      and pm.status = 'active'
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

  select * into existing_receipt_transaction
  from public.member_transactions
  where program_id = business_row.program_id
    and business_id = business_row.id
    and lower(trim(receipt_number)) = lower(receipt_number_value)
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
      select * into existing_transaction
      from public.member_transactions
      where recorded_by = v_actor_id
        and client_request_id = p_client_request_id
      limit 1;

      if found then
        return existing_transaction;
      end if;
    end if;

    raise exception 'This receipt or bill number has already been recorded.';
end;
$$;

revoke all on function public.record_member_transaction(text, numeric, text, text, uuid) from public;
grant execute on function public.record_member_transaction(text, numeric, text, text, uuid) to authenticated;

drop function if exists public.redeem_gift_card(uuid, uuid, numeric, text, numeric, uuid);
create function public.redeem_gift_card(
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
set search_path = public
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

  select * into actor_profile from public.profiles where id = v_actor_id;
  if not found then raise exception 'Redeeming profile not found'; end if;

  select * into business_row
  from public.businesses
  where id = p_business_id
    and active = true;

  if not found then raise exception 'Business not found'; end if;

  if actor_profile.role <> 'platform-admin' and (
    actor_profile.role not in ('business-owner', 'business-staff')
    or actor_profile.business_id is null
    or actor_profile.business_id <> p_business_id
    or not exists (
      select 1
      from public.program_memberships pm
      where pm.program_id = business_row.program_id
        and pm.profile_id = v_actor_id
        and pm.role::text = actor_profile.role::text
        and pm.business_id = business_row.id
        and pm.status = 'active'
    )
  ) then
    raise exception 'Permission denied';
  end if;

  select * into card_row
  from public.gift_cards
  where id = p_gift_card_id
  for update;

  if not found then raise exception 'Gift card not found'; end if;
  if card_row.program_id <> business_row.program_id then raise exception 'Gift card belongs to a different rewards program'; end if;
  if card_row.business_id <> p_business_id then raise exception 'Gift card belongs to a different business'; end if;
  if card_row.status = 'redeemed' then raise exception 'Gift card has no remaining balance'; end if;
  if card_row.status <> 'active' then raise exception 'Gift card is not active'; end if;

  select title, value_label into catalog_title, catalog_value_label
  from public.gift_card_catalog
  where id = card_row.catalog_id
    and program_id = business_row.program_id;

  available_balance_value := round(coalesce(
    card_row.remaining_balance,
    card_row.remaining_value_amount,
    card_row.initial_balance,
    card_row.original_value_amount,
    public.gift_card_face_value_from_label(catalog_value_label),
    0
  )::numeric, 2);

  if available_balance_value <= 0 then
    update public.gift_cards
    set status = 'redeemed',
        remaining_balance = 0,
        remaining_value_amount = 0,
        redeemed_at = coalesce(redeemed_at, now()),
        redeemed_by = coalesce(redeemed_by, v_actor_id),
        redeemed_at_business = coalesce(redeemed_at_business, p_business_id)
    where id = card_row.id;
    raise exception 'Gift card has no remaining balance';
  end if;

  if card_row.expires_at is not null and now() >= card_row.expires_at then
    update public.gift_cards set status = 'expired' where id = card_row.id;
    insert into public.gift_card_events (program_id, gift_card_id, event_type, actor_id, metadata)
    values (
      business_row.program_id,
      card_row.id,
      'expired',
      v_actor_id,
      jsonb_build_object('reason', 'redeem_attempt_after_expiry')
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

    select * into existing_receipt_transaction
    from public.member_transactions
    where program_id = business_row.program_id
      and business_id = business_row.id
      and lower(trim(receipt_number)) = lower(receipt_number_value)
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

  update public.gift_cards
  set status = case
        when remaining_balance_after_value <= 0 then 'redeemed'::public.gift_card_status
        else 'active'::public.gift_card_status
      end,
      original_value_amount = coalesce(
        original_value_amount,
        initial_balance,
        public.gift_card_face_value_from_label(catalog_value_label),
        available_balance_value
      ),
      initial_balance = coalesce(
        initial_balance,
        original_value_amount,
        public.gift_card_face_value_from_label(catalog_value_label),
        available_balance_value
      ),
      remaining_value_amount = remaining_balance_after_value,
      remaining_balance = remaining_balance_after_value,
      redeemed_at = case when remaining_balance_after_value <= 0 then now() else null end,
      redeemed_by = case when remaining_balance_after_value <= 0 then v_actor_id else null end,
      redeemed_at_business = case when remaining_balance_after_value <= 0 then p_business_id else null end,
      updated_at = now()
  where id = p_gift_card_id
    and program_id = business_row.program_id
    and status = 'active'
  returning * into updated_card;

  if not found then raise exception 'Gift card could not be updated'; end if;

  insert into public.gift_card_events (program_id, gift_card_id, event_type, actor_id, metadata)
  values (
    business_row.program_id,
    updated_card.id,
    'redeemed',
    v_actor_id,
    jsonb_build_object(
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

revoke all on function public.redeem_gift_card(uuid, uuid, numeric, text, numeric, uuid) from public;
grant execute on function public.redeem_gift_card(uuid, uuid, numeric, text, numeric, uuid) to authenticated;

notify pgrst, 'reload schema';
