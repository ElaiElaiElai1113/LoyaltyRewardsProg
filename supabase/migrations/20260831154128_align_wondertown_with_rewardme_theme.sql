-- Wondertown is RewardMe's branded test environment. Keep its name, logo, and
-- isolated test data while using the production RewardMe color system.
update public.programs
set
  primary_color = '#173f32',
  accent_color = '#b77b1f',
  updated_at = now()
where slug = 'wondertown';

do $$
begin
  if not exists (
    select 1
    from public.programs
    where slug = 'wondertown'
      and primary_color = '#173f32'
      and accent_color = '#b77b1f'
  ) then
    raise exception 'Wondertown theme alignment was not applied';
  end if;
end
$$;
