-- Read-only. Run before rollout; every returned row requires explicit investigation.
-- Membership status is intentionally ignored for historical ownership.
select 'loyality_business_settings'::text as table_name, r.business_id as record_id, 'business_program_mismatch'::text as reason
from public.loyality_business_settings r where not exists (select 1 from public.businesses b where b.id=r.business_id and b.program_id=r.program_id)
union all
select 'loyality_offers'::text as table_name, r.id as record_id, 'business_program_mismatch'::text as reason
from public.loyality_offers r where not exists (select 1 from public.businesses b where b.id=r.business_id and b.program_id=r.program_id)
union all
select 'loyality_offer_claims'::text as table_name, r.id as record_id, 'business_program_mismatch'::text as reason
from public.loyality_offer_claims r where not exists (select 1 from public.businesses b where b.id=r.business_id and b.program_id=r.program_id)
union all
select 'loyality_visit_rules'::text as table_name, r.id as record_id, 'business_program_mismatch'::text as reason
from public.loyality_visit_rules r where not exists (select 1 from public.businesses b where b.id=r.business_id and b.program_id=r.program_id)
union all
select 'loyality_visits'::text as table_name, r.id as record_id, 'business_program_mismatch'::text as reason
from public.loyality_visits r where not exists (select 1 from public.businesses b where b.id=r.business_id and b.program_id=r.program_id)
union all
select 'loyality_voucher_catalog'::text as table_name, r.id as record_id, 'business_program_mismatch'::text as reason
from public.loyality_voucher_catalog r where not exists (select 1 from public.businesses b where b.id=r.business_id and b.program_id=r.program_id)
union all
select 'loyality_vouchers'::text as table_name, r.id as record_id, 'business_program_mismatch'::text as reason
from public.loyality_vouchers r where not exists (select 1 from public.businesses b where b.id=r.business_id and b.program_id=r.program_id)
union all
select 'loyality_raffles'::text as table_name, r.id as record_id, 'business_program_mismatch'::text as reason
from public.loyality_raffles r where not exists (select 1 from public.businesses b where b.id=r.business_id and b.program_id=r.program_id)
union all
select 'loyality_raffle_entries'::text as table_name, r.id as record_id, 'business_program_mismatch'::text as reason
from public.loyality_raffle_entries r where not exists (select 1 from public.businesses b where b.id=r.business_id and b.program_id=r.program_id)
union all
select 'loyality_offer_claims'::text as table_name, r.id as record_id, 'customer_program_membership_missing'::text as reason
from public.loyality_offer_claims r where not exists (select 1 from public.program_memberships pm where pm.program_id=r.program_id and pm.profile_id=r.customer_id and pm.role='member')
union all
select 'loyality_visits'::text as table_name, r.id as record_id, 'customer_program_membership_missing'::text as reason
from public.loyality_visits r where not exists (select 1 from public.program_memberships pm where pm.program_id=r.program_id and pm.profile_id=r.customer_id and pm.role='member')
union all
select 'loyality_vouchers'::text as table_name, r.id as record_id, 'customer_program_membership_missing'::text as reason
from public.loyality_vouchers r where not exists (select 1 from public.program_memberships pm where pm.program_id=r.program_id and pm.profile_id=r.customer_id and pm.role='member')
union all
select 'loyality_raffle_entries'::text as table_name, r.id as record_id, 'customer_program_membership_missing'::text as reason
from public.loyality_raffle_entries r where not exists (select 1 from public.program_memberships pm where pm.program_id=r.program_id and pm.profile_id=r.customer_id and pm.role='member')
union all
select 'loyality_offer_claims'::text as table_name, r.id as record_id, 'referrer_program_membership_missing'::text as reason
from public.loyality_offer_claims r where r.referrer_id is not null and not exists (select 1 from public.program_memberships pm where pm.program_id=r.program_id and pm.profile_id=r.referrer_id and pm.role='member')
union all
select 'loyality_offer_claims'::text as table_name, r.id as record_id, 'offer_reference_mismatch'::text as reason
from public.loyality_offer_claims r where not exists (select 1 from public.loyality_offers s where s.id=r.offer_id and s.business_id=r.business_id and s.program_id=r.program_id)
union all
select 'loyality_visits'::text as table_name, r.id as record_id, 'transaction_reference_mismatch'::text as reason
from public.loyality_visits r where not exists (select 1 from public.member_transactions s where s.id=r.member_transaction_id and s.business_id=r.business_id and s.program_id=r.program_id and s.profile_id=r.customer_id)
union all
select 'loyality_raffle_entries'::text as table_name, r.id as record_id, 'transaction_reference_mismatch'::text as reason
from public.loyality_raffle_entries r where not exists (select 1 from public.member_transactions s where s.id=r.member_transaction_id and s.business_id=r.business_id and s.program_id=r.program_id and s.profile_id=r.customer_id)
union all
select 'loyality_raffle_entries'::text as table_name, r.id as record_id, 'raffle_reference_mismatch'::text as reason
from public.loyality_raffle_entries r where not exists (select 1 from public.loyality_raffles s where s.id=r.raffle_id and s.business_id=r.business_id and s.program_id=r.program_id)
union all
select 'loyality_vouchers'::text as table_name, r.id as record_id, 'voucher_source_missing'::text as reason
from public.loyality_vouchers r where r.source_kind <> 'manual' and (r.source_id is null or r.source_event_id is null)
union all
select 'loyality_vouchers'::text as table_name, r.id as record_id, 'acquisition_offer_source_mismatch'::text as reason
from public.loyality_vouchers r where r.source_kind='acquisition_offer' and not exists (select 1 from public.loyality_offer_claims s where s.id=r.source_event_id and s.offer_id=r.source_id and s.business_id=r.business_id and s.program_id=r.program_id and s.customer_id=r.customer_id)
union all
select 'loyality_vouchers'::text as table_name, r.id as record_id, 'referral_source_mismatch'::text as reason
from public.loyality_vouchers r where r.source_kind='referral' and not exists (select 1 from public.loyality_offer_claims s where s.id=r.source_event_id and s.offer_id=r.source_id and s.business_id=r.business_id and s.program_id=r.program_id and s.referrer_id=r.customer_id)
union all
select 'loyality_vouchers'::text as table_name, r.id as record_id, 'visit_rule_source_mismatch'::text as reason
from public.loyality_vouchers r where r.source_kind='visit_rule' and not exists (select 1 from public.loyality_visit_rules s where s.id=r.source_id and s.business_id=r.business_id and s.program_id=r.program_id)
union all
select 'loyality_vouchers'::text as table_name, r.id as record_id, 'points_catalog_source_mismatch'::text as reason
from public.loyality_vouchers r where r.source_kind='points_catalog' and not exists (select 1 from public.loyality_voucher_catalog s where s.id=r.source_id and s.business_id=r.business_id and s.program_id=r.program_id)
union all
select 'loyality_vouchers'::text as table_name, r.id as record_id, 'visit_transaction_source_mismatch'::text as reason
from public.loyality_vouchers r where r.source_kind='visit_rule' and not exists (select 1 from public.member_transactions s where s.id=r.source_event_id and s.business_id=r.business_id and s.program_id=r.program_id and s.profile_id=r.customer_id)
union all
select 'loyality_vouchers'::text as table_name, r.id as record_id, 'catalog_request_reused'::text as reason
from public.loyality_vouchers r where r.source_kind='points_catalog' and exists (select 1 from public.loyality_vouchers s where s.source_kind='points_catalog' and s.customer_id=r.customer_id and s.source_event_id=r.source_event_id and s.id<>r.id);
