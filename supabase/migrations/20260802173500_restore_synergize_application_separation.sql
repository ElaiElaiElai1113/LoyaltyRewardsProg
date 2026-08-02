-- Synergize Business Group is a separate application and Vercel project.
-- Restore the non-routable Rewards Platform placeholder and remove only the
-- synthetic, non-billed Launch entitlement added during the mistaken cutover.
alter table public.program_domains disable trigger enforce_custom_domain_limit;

update public.program_domains
set
  hostname = 'synergize.example',
  is_primary = true,
  verification_status = 'pending',
  verified_at = null
where program_id = (select id from public.programs where slug = 'synergize')
  and is_primary
  and hostname = 'synergize-rewards.vercel.app';

alter table public.program_domains enable trigger enforce_custom_domain_limit;

delete from public.program_subscriptions ps
using public.programs p, public.subscription_plans sp
where ps.program_id = p.id
  and ps.plan_id = sp.id
  and p.slug = 'synergize'
  and sp.code = 'launch'
  and ps.status = 'trialing'
  and ps.stripe_customer_id is null
  and ps.stripe_subscription_id is null
  and ps.current_period_start is null
  and ps.current_period_end is null
  and ps.cancel_at_period_end = false;
