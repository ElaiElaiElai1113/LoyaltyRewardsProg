-- Restore the auth hook that creates the application-side account records.
-- The function already exists in upgraded databases, but the trigger can be
-- omitted when a project is restored from a partial schema export.
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Repair modern website registrations made while the trigger was absent.
-- Restrict the backfill to users carrying a valid active_program_id so older
-- Auth-only support accounts are not silently assigned to the legacy default
-- program.
select set_config('request.jwt.claim.role', 'service_role', true);

insert into public.profiles (
  id,
  full_name,
  email,
  phone,
  role,
  business_id,
  registered_by_business_id,
  referral_code,
  verification_id_number,
  verification_document_path,
  verification_document_filename,
  verification_submitted_at,
  verification_status
)
select
  users.id,
  coalesce(nullif(trim(users.raw_user_meta_data ->> 'full_name'), ''), users.email),
  users.email,
  coalesce(
    nullif(trim(users.raw_user_meta_data ->> 'phone'), ''),
    nullif(trim(users.raw_user_meta_data ->> 'whatsapp'), ''),
    ''
  ),
  coalesce(
    nullif(users.raw_app_meta_data ->> 'role', '')::public.user_role,
    'customer'::public.user_role
  ),
  nullif(users.raw_app_meta_data ->> 'business_id', '')::uuid,
  nullif(
    coalesce(
      users.raw_user_meta_data ->> 'registered_by_business_id',
      users.raw_app_meta_data ->> 'registered_by_business_id',
      ''
    ),
    ''
  )::uuid,
  public.generate_referral_code(),
  nullif(trim(users.raw_user_meta_data ->> 'verification_id_number'), ''),
  nullif(trim(users.raw_user_meta_data ->> 'verification_document_path'), ''),
  nullif(trim(users.raw_user_meta_data ->> 'verification_document_filename'), ''),
  case
    when nullif(trim(users.raw_user_meta_data ->> 'verification_document_path'), '') is null then null
    else now()
  end,
  case
    when nullif(trim(users.raw_user_meta_data ->> 'verification_id_number'), '') is not null
      and nullif(trim(users.raw_user_meta_data ->> 'verification_document_path'), '') is null
      then 'pending_document'
    when nullif(trim(users.raw_user_meta_data ->> 'verification_document_path'), '') is not null
      then 'submitted'
    else 'not_submitted'
  end
from auth.users as users
join public.programs as programs
  on programs.id = nullif(users.raw_user_meta_data ->> 'active_program_id', '')::uuid
 and programs.status in ('draft', 'active')
left join public.profiles as profiles
  on profiles.id = users.id
where profiles.id is null;

insert into public.reward_balances (
  program_id,
  profile_id,
  points,
  next_reward_points,
  available_credits
)
select
  programs.id,
  profiles.id,
  0,
  300,
  0
from auth.users as users
join public.profiles as profiles
  on profiles.id = users.id
join public.programs as programs
  on programs.id = nullif(users.raw_user_meta_data ->> 'active_program_id', '')::uuid
 and programs.status in ('draft', 'active')
left join public.reward_balances as balances
  on balances.program_id = programs.id
 and balances.profile_id = profiles.id
where balances.id is null
on conflict (program_id, profile_id) do nothing;
