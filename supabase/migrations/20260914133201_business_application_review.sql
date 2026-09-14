create function public.can_review_business_applications(p_program_id uuid) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$
 select auth.uid() is not null and (public.is_platform_admin() or exists(select 1 from public.program_memberships where program_id=p_program_id and profile_id=auth.uid() and role='program-admin' and status='active'))
$$;
revoke all on function public.can_review_business_applications(uuid) from public,anon;
grant execute on function public.can_review_business_applications(uuid) to authenticated;
grant select on public.business_applications to authenticated;
create policy application_reviewer_read on public.business_applications for select to authenticated using(public.can_review_business_applications(program_id));
create table public.business_application_review_events (
 id uuid primary key default gen_random_uuid(),application_id uuid not null references public.business_applications(id) on delete restrict,
 actor_id uuid not null references public.profiles(id) on delete restrict,from_status text not null,to_status text not null,reason text not null check(length(trim(reason)) between 3 and 2000),created_at timestamptz not null default now()
);
alter table public.business_application_review_events enable row level security;
revoke all on public.business_application_review_events from public,anon,authenticated,service_role;
grant select on public.business_application_review_events to authenticated,service_role;
create policy application_review_history_read on public.business_application_review_events for select to authenticated using(exists(select 1 from public.business_applications a where a.id=application_id and public.can_review_business_applications(a.program_id)));
create trigger business_application_review_immutable before update or delete on public.business_application_review_events for each row execute function public.guard_business_application_intent();

create function public.review_business_application(p_application_id uuid,p_expected_status text,p_next_status text,p_reason text) returns public.business_applications
language plpgsql security definer set search_path=pg_catalog,public as $$
declare app public.business_applications;
begin
 select * into app from public.business_applications where id=p_application_id for update;
 if not found or not public.can_review_business_applications(app.program_id) then raise exception 'application_reviewer_required'; end if;
 if exists(select 1 from public.profiles where id=auth.uid() and lower(email)=lower(app.representative_email)) then raise exception 'independent_reviewer_required'; end if;
 if p_expected_status is null or app.status<>p_expected_status then raise exception 'application_review_conflict'; end if;
 if not ((app.status='submitted' and p_next_status in ('in_review','withdrawn')) or (app.status='in_review' and p_next_status in ('approved','declined','withdrawn'))) then raise exception 'invalid_application_transition'; end if;
 if length(trim(coalesce(p_reason,''))) not between 3 and 2000 then raise exception 'review_reason_required'; end if;
 insert into public.business_application_review_events(application_id,actor_id,from_status,to_status,reason) values(app.id,auth.uid(),app.status,p_next_status,trim(p_reason));
 update public.business_applications set status=p_next_status,updated_at=now() where id=app.id returning * into app;
 return app;
end $$;
revoke all on function public.review_business_application(uuid,text,text,text) from public,anon;
grant execute on function public.review_business_application(uuid,text,text,text) to authenticated;
comment on function public.review_business_application(uuid,text,text,text) is 'Review decision only. Does not provision or activate a business, publish terms, or accept terms for an applicant.';
