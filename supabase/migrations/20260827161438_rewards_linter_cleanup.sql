-- Production audit: https://github.com/ElaiElaiElai1113/LoyaltyRewardsProg/actions/runs/33095933857
--
-- These policy rewrites preserve the existing predicates while evaluating the
-- authenticated user/JWT once per statement instead of once per candidate row.
do $$
declare
  target record;
  current_using text;
  current_check text;
  optimized_using text;
  optimized_check text;
begin
  for target in
    select * from (values
      ('profiles', 'Business owners can view profiles for their business'),
      ('gift_cards', 'Customers can read own gift cards'),
      ('member_transactions', 'Business staff can view own business member transactions'),
      ('order_line_items', 'Create line items via orders'),
      ('gift_card_events', 'Gift card event scoped reads'),
      ('member_transactions', 'Members can view own member transactions'),
      ('member_transactions', 'Platform admins can view all member transactions'),
      ('reward_balances', 'System can insert balances'),
      ('orders', 'Users can create orders'),
      ('redemptions', 'Users can create redemptions'),
      ('profiles', 'Users can update own profile'),
      ('agreement_versions', 'Users can view active agreement versions'),
      ('activities', 'Users can view own activities'),
      ('agreement_acceptances', 'Users can view own agreement acceptances'),
      ('reward_balances', 'Users can view own balance'),
      ('memberships', 'Users can view own membership'),
      ('orders', 'Users can view own orders'),
      ('profiles', 'Users can view own profile'),
      ('redemptions', 'Users can view own redemptions'),
      ('order_line_items', 'View line items via orders'),
      ('business_customer_links', 'business teams create their customer links'),
      ('credit_redemptions', 'members create own program credit codes'),
      ('credit_redemptions', 'members expire own pending program credit codes'),
      ('business_customer_links', 'members read own business links'),
      ('credit_redemptions', 'members read own program credit codes'),
      ('partner_referrals', 'members read own program partner referrals'),
      ('referrals', 'members read own program referrals'),
      ('profiles', 'profiles_self_access'),
      ('profiles', 'profiles_self_update'),
      ('promotions', 'promotions_public_read'),
      ('reward_catalog', 'reward_catalog_public_read'),
      ('program_memberships', 'users read program memberships')
    ) as audited_policy(table_name, policy_name)
  loop
    select
      pg_get_expr(policy.polqual, policy.polrelid),
      pg_get_expr(policy.polwithcheck, policy.polrelid)
    into current_using, current_check
    from pg_policy policy
    join pg_class relation on relation.oid = policy.polrelid
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = target.table_name
      and policy.polname = target.policy_name;

    if not found then
      raise exception 'Audited RLS policy %.% no longer exists', target.table_name, target.policy_name;
    end if;

    optimized_using := replace(replace(current_using, 'auth.uid()', '(select auth.uid())'), 'auth.jwt()', '(select auth.jwt())');
    optimized_check := replace(replace(current_check, 'auth.uid()', '(select auth.uid())'), 'auth.jwt()', '(select auth.jwt())');

    if optimized_using is not distinct from current_using
      and optimized_check is not distinct from current_check then
      raise exception 'Audited RLS policy %.% no longer contains an optimizable auth call', target.table_name, target.policy_name;
    end if;

    if optimized_using is not null and optimized_check is not null then
      execute format(
        'alter policy %I on public.%I using (%s) with check (%s)',
        target.policy_name, target.table_name, optimized_using, optimized_check
      );
    elsif optimized_using is not null then
      execute format(
        'alter policy %I on public.%I using (%s)',
        target.policy_name, target.table_name, optimized_using
      );
    elsif optimized_check is not null then
      execute format(
        'alter policy %I on public.%I with check (%s)',
        target.policy_name, target.table_name, optimized_check
      );
    else
      raise exception 'Audited RLS policy %.% has neither USING nor WITH CHECK', target.table_name, target.policy_name;
    end if;
  end loop;
end
$$;

-- Keep the unique constraints and current canonical indexes; remove only exact
-- non-constraint duplicates identified by the production catalog audit.
drop index if exists public.idx_business_branding_legacy_business;
drop index if exists public.idx_customers_shopify_customer_id;
drop index if exists public.idx_gift_card_events_card;
drop index if exists public.idx_gift_cards_business;
drop index if exists public.idx_gift_cards_customer;
drop index if exists public.idx_gift_cards_public_token;
drop index if exists public.idx_gift_cards_token;
drop index if exists public.idx_gift_cards_status;
drop index if exists public.idx_promotions_business;
drop index if exists public.idx_reward_catalog_legacy_reward;

-- Trigger functions are invoked by PostgreSQL through their registered
-- triggers. They are not public RPC endpoints and need no client EXECUTE grant.
revoke execute on function public.assign_new_balance_to_program() from public, anon, authenticated;
revoke execute on function public.assign_new_profile_to_program() from public, anon, authenticated;
revoke execute on function public.enforce_business_program_match() from public, anon, authenticated;
revoke execute on function public.enforce_program_feature() from public, anon, authenticated;
revoke execute on function public.enforce_program_resource_limit() from public, anon, authenticated;
revoke execute on function public.enforce_tenant_write_access() from public, anon, authenticated;
revoke execute on function public.enforce_verified_profile_value_action() from public, anon, authenticated;
revoke execute on function public.process_loyality_member_transaction() from public, anon, authenticated;
revoke execute on function public.sync_business_customer_link_from_activity() from public, anon, authenticated;
revoke execute on function public.validate_business_customer_link() from public, anon, authenticated;
