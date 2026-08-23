-- Align the stored-value contract with the confirmed operating policy:
-- gift cards never expire, remain the issuing business's store-credit
-- liability, and do not transfer Synergize Credits when used.

begin;

alter table public.gift_cards
  alter column expires_at drop not null;

update public.gift_cards
set
  expires_at = null,
  status = case
    when status = 'expired' and coalesce(
      remaining_balance,
      remaining_value_amount,
      initial_balance,
      original_value_amount,
      0
    ) > 0 then 'active'::public.gift_card_status
    when status = 'expired' then 'redeemed'::public.gift_card_status
    else status
  end,
  redeemed_at = case
    when status = 'expired' and coalesce(
      remaining_balance,
      remaining_value_amount,
      initial_balance,
      original_value_amount,
      0
    ) <= 0 then coalesce(redeemed_at, now())
    else redeemed_at
  end
where expires_at is not null
   or status = 'expired';

create or replace function private.enforce_non_expiring_gift_card()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.expires_at := null;

  if new.status = 'expired' then
    new.status := case
      when coalesce(
        new.remaining_balance,
        new.remaining_value_amount,
        new.initial_balance,
        new.original_value_amount,
        0
      ) > 0 then 'active'::public.gift_card_status
      else 'redeemed'::public.gift_card_status
    end;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_non_expiring_gift_card()
  from public, anon, authenticated, service_role;

drop trigger if exists enforce_non_expiring_gift_card on public.gift_cards;
create trigger enforce_non_expiring_gift_card
before insert or update on public.gift_cards
for each row execute function private.enforce_non_expiring_gift_card();

create or replace function public.get_business_accounting_report(
  p_business_id uuid,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (
  event_id uuid,
  transaction_id uuid,
  gift_card_id uuid,
  gift_card_code text,
  customer_id uuid,
  customer_name text,
  receipt_number text,
  sale_total numeric,
  gift_card_applied numeric,
  other_payment_due numeric,
  balance_before numeric,
  balance_after numeric,
  funding_source text,
  reimbursement_estimate numeric,
  reimbursement_status text,
  commission_amount numeric,
  commission_status text,
  redeemed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_business_id is null then
    raise exception 'Business is required';
  end if;

  if p_from is not null and p_to is not null and p_from >= p_to then
    raise exception 'The report start must be before the report end';
  end if;

  if not public.is_platform_admin() then
    if not public.has_active_business_program_access(
      p_business_id,
      array['business-owner']::public.program_role[]
    ) then
      raise exception 'Permission denied';
    end if;

    if private.has_required_agreements(v_actor_id) is not true then
      raise exception 'Required agreements must be accepted';
    end if;
  end if;

  return query
  with redemption_rows as (
    select
      event.id as event_id,
      event.gift_card_id,
      event.created_at as redeemed_at,
      event.metadata,
      card.program_id,
      card.business_id,
      card.customer_id,
      card.code as gift_card_code,
      card.points_spent,
      issuer.role::text as issuer_role,
      coalesce(customer.full_name, 'Member') as customer_name,
      nullif(trim(event.metadata ->> 'receipt_number'), '') as receipt_number,
      round(coalesce(
        nullif(event.metadata ->> 'total_before_gift_card', '')::numeric,
        nullif(event.metadata ->> 'original_bill', '')::numeric,
        nullif(event.metadata ->> 'gift_card_amount', '')::numeric,
        0
      ), 2) as sale_total,
      round(coalesce(nullif(event.metadata ->> 'gift_card_amount', '')::numeric, 0), 2) as gift_card_applied,
      round(coalesce(
        nullif(event.metadata ->> 'final_bill', '')::numeric,
        greatest(
          coalesce(nullif(event.metadata ->> 'original_bill', '')::numeric, 0)
          - coalesce(nullif(event.metadata ->> 'gift_card_amount', '')::numeric, 0),
          0
        )
      ), 2) as other_payment_due,
      round(coalesce(nullif(event.metadata ->> 'remaining_balance_before', '')::numeric, 0), 2) as balance_before,
      round(coalesce(nullif(event.metadata ->> 'remaining_balance_after', '')::numeric, 0), 2) as balance_after
    from public.gift_card_events event
    join public.gift_cards card
      on card.id = event.gift_card_id
     and card.business_id = p_business_id
    join public.businesses business
      on business.id = card.business_id
     and business.program_id = card.program_id
    join public.profiles customer on customer.id = card.customer_id
    left join public.profiles issuer on issuer.id = card.issued_by
    where event.event_type = 'redeemed'
      and event.metadata ? 'gift_card_amount'
      and (p_from is null or event.created_at >= p_from)
      and (p_to is null or event.created_at < p_to)
  )
  select
    redemption.event_id,
    member_transaction.id as transaction_id,
    redemption.gift_card_id,
    redemption.gift_card_code,
    redemption.customer_id,
    redemption.customer_name,
    redemption.receipt_number,
    redemption.sale_total,
    redemption.gift_card_applied,
    redemption.other_payment_due,
    redemption.balance_before,
    redemption.balance_after,
    case
      when redemption.points_spent > 0 then 'program_points'
      when redemption.issuer_role = 'platform-admin' then 'program_grant'
      when redemption.issuer_role in ('business-owner', 'business-staff') then 'business_issued'
      else 'review_required'
    end as funding_source,
    0::numeric as reimbursement_estimate,
    case
      when redemption.points_spent > 0
        or redemption.issuer_role in ('platform-admin', 'business-owner', 'business-staff')
        then 'not_applicable'
      else 'review_required'
    end as reimbursement_status,
    round(coalesce(member_transaction.commission_amount, 0), 2) as commission_amount,
    coalesce(member_transaction.commission_status::text, 'not_recorded') as commission_status,
    redemption.redeemed_at
  from redemption_rows redemption
  left join public.member_transactions member_transaction
    on member_transaction.program_id = redemption.program_id
   and member_transaction.business_id = redemption.business_id
   and member_transaction.receipt_number is not null
   and redemption.receipt_number is not null
   and lower(trim(member_transaction.receipt_number)) = lower(redemption.receipt_number)
  order by redemption.redeemed_at desc, redemption.event_id desc;
end;
$$;

revoke all on function public.get_business_accounting_report(uuid, timestamptz, timestamptz)
  from public, anon, authenticated, service_role;
grant execute on function public.get_business_accounting_report(uuid, timestamptz, timestamptz)
  to authenticated;

notify pgrst, 'reload schema';

commit;
