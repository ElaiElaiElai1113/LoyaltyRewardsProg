-- Keep customer QR access inside the permission-checked business customer RPC.
-- Browser clients must not query the profiles table to assemble this list.
drop function if exists public.get_business_customers(uuid);

create function public.get_business_customers(p_business_id uuid)
returns table (
  id uuid,
  full_name text,
  email text,
  member_qr_token text,
  points integer,
  verification_status text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_program_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select b.program_id into v_program_id
  from public.businesses b
  where b.id = p_business_id;

  if v_program_id is null then
    raise exception 'business_not_found';
  end if;

  if not public.is_platform_admin()
    and not public.has_active_business_program_access(
      p_business_id,
      array['business-owner', 'business-staff']::public.program_role[]
    )
    and not public.is_program_member(
      v_program_id,
      array['program-admin']::public.program_role[]
    )
  then
    raise exception 'permission_denied';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.email,
    p.member_qr_token,
    coalesce(rb.points, 0),
    p.verification_status::text
  from public.business_customer_links link
  join public.profiles p
    on p.id = link.profile_id
   and p.role::text = 'customer'
  join public.program_memberships pm
    on pm.program_id = link.program_id
   and pm.profile_id = link.profile_id
   and pm.role = 'member'
   and pm.status = 'active'
  left join public.reward_balances rb
    on rb.program_id = link.program_id
   and rb.profile_id = link.profile_id
  where link.program_id = v_program_id
    and link.business_id = p_business_id
  order by p.full_name, p.id;
end;
$$;

revoke all on function public.get_business_customers(uuid) from public;
grant execute on function public.get_business_customers(uuid) to authenticated;
