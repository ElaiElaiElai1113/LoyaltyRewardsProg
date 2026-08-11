-- RewardMe is the final public brand for the existing Pinas tenant.
-- Keep the stable UUID, slug, hostname, and program-scoped data relationships.
update public.programs
set
  name = 'RewardMe',
  primary_color = '#173f32',
  accent_color = '#b77b1f',
  logo_url = '/rewardme-mark.svg',
  map_latitude = 7.1907,
  map_longitude = 125.4553,
  updated_at = now()
where id = '10000000-0000-4000-8000-000000000004'
  and slug = 'pinas';
