do $$
begin
  if not exists (
    select 1
    from public.programs
    where slug = 'wondertown'
      and name = 'Wondertown Rewards'
      and primary_color = '#173f32'
      and accent_color = '#b77b1f'
      and coalesce((feature_flags ->> 'demoTenant')::boolean, false)
  ) then
    raise exception 'Wondertown identity, sandbox flag, or RewardMe theme metadata is incorrect';
  end if;
end
$$;
