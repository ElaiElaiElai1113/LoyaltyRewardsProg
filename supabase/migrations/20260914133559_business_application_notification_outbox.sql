-- Events are queued atomically with intake/review. Delivery is a separate operation.
create table public.business_application_notification_outbox (
 id uuid primary key default gen_random_uuid(),event_key text not null unique,
 application_id uuid not null references public.business_applications(id) on delete restrict,
 kind text not null check(kind in ('application_received','application_reviewed')),
 payload jsonb not null,status text not null default 'pending' check(status in ('pending','sending','delivered','failed')),
 attempts integer not null default 0,available_at timestamptz not null default now(),lease_id uuid,lease_until timestamptz,
 provider_reference text,last_error text,created_at timestamptz not null default now(),delivered_at timestamptz
);
alter table public.business_application_notification_outbox enable row level security;
revoke all on public.business_application_notification_outbox from public,anon,authenticated,service_role;
grant select on public.business_application_notification_outbox to service_role;
create function public.queue_business_application_notification() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if tg_table_name='business_application_intents' then
 insert into public.business_application_notification_outbox(event_key,application_id,kind,payload) values('received:'||new.application_id,new.application_id,'application_received',jsonb_build_object('status','submitted'));
 else
 insert into public.business_application_notification_outbox(event_key,application_id,kind,payload) values('review:'||new.id,new.application_id,'application_reviewed',jsonb_build_object('status',new.to_status));
 end if;
 return new;
end $$;
revoke all on function public.queue_business_application_notification() from public,anon,authenticated,service_role;
create trigger application_received_notification after insert on public.business_application_intents for each row execute function public.queue_business_application_notification();
create trigger application_reviewed_notification after insert on public.business_application_review_events for each row execute function public.queue_business_application_notification();

create function public.claim_business_application_notifications(p_limit integer default 10) returns setof public.business_application_notification_outbox
language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if p_limit is null or p_limit not between 1 and 100 then raise exception 'invalid_batch_size'; end if;
 update public.business_application_notification_outbox set status='failed',last_error='delivery_attempts_exhausted',lease_id=null,lease_until=null where status='sending' and lease_until<now() and attempts>=5;
 return query with candidates as (
 select id from public.business_application_notification_outbox where attempts<5 and ((status='pending' and available_at<=now()) or (status='sending' and lease_until<now())) order by created_at for update skip locked limit p_limit
 ) update public.business_application_notification_outbox o set status='sending',attempts=o.attempts+1,lease_id=gen_random_uuid(),lease_until=now()+interval '5 minutes' from candidates c where o.id=c.id returning o.*;
end $$;
create function public.finish_business_application_notification(p_id uuid,p_lease_id uuid,p_provider_reference text,p_error text default null) returns boolean
language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if p_error is null and length(trim(coalesce(p_provider_reference,'')))=0 then raise exception 'provider_reference_required'; end if;
 update public.business_application_notification_outbox set status=case when p_error is null then 'delivered' when attempts>=5 then 'failed' else 'pending' end,
 provider_reference=case when p_error is null then p_provider_reference else provider_reference end,last_error=left(p_error,500),available_at=now()+interval '5 minutes',delivered_at=case when p_error is null then now() else null end,lease_id=null,lease_until=null
 where id=p_id and lease_id=p_lease_id and status='sending' and lease_until>now();
 return found;
end $$;
revoke all on function public.claim_business_application_notifications(integer) from public,anon,authenticated;
revoke all on function public.finish_business_application_notification(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.claim_business_application_notifications(integer) to service_role;
grant execute on function public.finish_business_application_notification(uuid,uuid,text,text) to service_role;
