-- Align the live Loyality tenant metadata with Shaun's approved Option B
-- editorial system. Runtime CSS remains tenant-scoped; this update ensures
-- document metadata, install surfaces, and database-backed branding agree.
update public.programs
set
  primary_color = '#1f3a2e',
  accent_color = '#b8862e',
  logo_url = '/loyality-logo.svg',
  updated_at = now()
where slug = 'loyality';

do $$
begin
  if not exists (
    select 1
    from public.programs
    where slug = 'loyality'
      and primary_color = '#1f3a2e'
      and accent_color = '#b8862e'
      and logo_url = '/loyality-logo.svg'
  ) then
    raise exception 'Loyality Option B theme alignment was not applied';
  end if;
end
$$;
