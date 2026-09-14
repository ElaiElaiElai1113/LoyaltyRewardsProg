-- Intake acknowledgements only. This does not publish or accept a commercial agreement.
create table public.business_application_intents (
 program_id uuid not null references public.programs(id) on delete restrict,
 request_id uuid not null,
 application_id uuid not null unique references public.business_applications(id) on delete restrict,
 payload jsonb not null,
 payload_hash text not null,
 acknowledgement_version text not null,
 acknowledgement_snapshot text not null,
 source_hash text not null,
 created_at timestamptz not null default now(),
 primary key(program_id,request_id)
);
alter table public.business_application_intents enable row level security;
revoke all on public.business_application_intents from public,anon,authenticated,service_role;
grant select on public.business_application_intents to service_role;
create index business_application_intents_abuse_window on public.business_application_intents(program_id,source_hash,created_at);

create function public.guard_business_application_intent() returns trigger language plpgsql set search_path=pg_catalog as $$
begin raise exception 'application_evidence_is_immutable'; end $$;
create trigger business_application_intent_immutable before update or delete on public.business_application_intents for each row execute function public.guard_business_application_intent();
revoke all on function public.guard_business_application_intent() from public,anon,authenticated,service_role;

create function public.submit_business_application_intent(p_program_id uuid,p_request_id uuid,p_payload jsonb,p_source_hash text,p_hourly_limit integer default 10)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare prior public.business_application_intents; app public.business_applications; fingerprint text;
 acknowledgement constant text := 'This is an application for review. Contact consent permits follow-up about this application. Submission does not accept commercial terms, approve membership, activate a business, or authorize payment.';
begin
 if p_request_id is null or jsonb_typeof(p_payload) <> 'object' or octet_length(p_payload::text)>16384 then raise exception using errcode='22023',message='invalid_application_payload'; end if;
 if not exists(select 1 from public.programs where id=p_program_id and slug in ('pinas','wondertown') and status='active') then raise exception using errcode='22023',message='invalid_application_program'; end if;
 if p_hourly_limit not between 1 and 100 or p_source_hash !~ '^[a-f0-9]{64}$' then raise exception using errcode='22023',message='invalid_intake_configuration'; end if;
 fingerprint := encode(sha256(convert_to(p_payload::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended(p_program_id::text||p_request_id::text,0));
 select * into prior from public.business_application_intents where program_id=p_program_id and request_id=p_request_id;
 if found then
  if prior.payload_hash<>fingerprint or prior.payload<>p_payload then raise exception using errcode='BA409',message='application_request_payload_conflict'; end if;
  select * into app from public.business_applications where id=prior.application_id;
  return jsonb_build_object('reference',app.application_reference,'status',app.status,'replayed',true);
 end if;
 if p_payload->>'disclosure_version'<>'application-review-v1' or p_payload->>'contact_consent'<>'true' then raise exception using errcode='22023',message='invalid_application_acknowledgement'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_program_id::text||p_source_hash,1));
 if (select count(*) from public.business_application_intents where program_id=p_program_id and source_hash=p_source_hash and created_at>now()-interval '1 hour')>=p_hourly_limit then raise exception using errcode='BA429',message='application_rate_limit'; end if;
 insert into public.business_applications(program_id,application_reference,model,legal_name,dba,industry,street,city,region,postal,country,website,off_peak,representative_name,representative_title,representative_email,representative_phone,reward_rate,redemption_access,credit_method,disclosure_version,contact_consent_at,source_hostname)
 values(p_program_id,'RWD-BIZ-'||replace(gen_random_uuid()::text,'-',''),p_payload->>'model',p_payload->>'legal_name',p_payload->>'dba',p_payload->>'industry',p_payload->>'street',p_payload->>'city',p_payload->>'region',p_payload->>'postal',p_payload->>'country',p_payload->>'website',p_payload->>'off_peak',p_payload->>'representative_name',p_payload->>'representative_title',p_payload->>'representative_email',p_payload->>'representative_phone',p_payload->>'reward_rate',p_payload->>'redemption_access',p_payload->>'credit_method','application-review-v1',now(),p_payload->>'source_hostname') returning * into app;
 insert into public.business_application_intents values(p_program_id,p_request_id,app.id,p_payload,fingerprint,'application-review-v1',acknowledgement,p_source_hash,now());
 return jsonb_build_object('reference',app.application_reference,'status',app.status,'replayed',false);
end $$;
revoke all on function public.submit_business_application_intent(uuid,uuid,jsonb,text,integer) from public,anon,authenticated;
grant execute on function public.submit_business_application_intent(uuid,uuid,jsonb,text,integer) to service_role;
