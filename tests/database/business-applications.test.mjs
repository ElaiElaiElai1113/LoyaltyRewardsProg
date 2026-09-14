import {after,before,test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
import {localDatabase} from './local-postgres.mjs'
const db=localDatabase('application_intake');const sql=db.sql
const p='10000000-0000-4000-8000-000000000001'
const payload={model:'commission',legal_name:'Test Co',industry:'Cafe',street:'Test street',city:'Test City',region:'Test Region',postal:'1000',country:'Test',representative_name:'Tester',representative_title:'Owner',representative_email:'test@example.test',representative_phone:'123456789',reward_rate:'20% back',redemption_access:'earn-only',disclosure_version:'application-review-v1',contact_consent:true,source_hostname:'myrewardme.com'}
const submit=(key,data=payload,source='a'.repeat(64),limit=10)=>`set role service_role;select public.submit_business_application_intent('${p}','${key}','${JSON.stringify(data)}','${source}',${limit})`
before(async()=>{await db.create();await sql(`create table public.programs(id uuid primary key,slug text,status text);insert into programs values('${p}','pinas','active');${readFileSync('supabase/migrations/20260827161436_rewardme_business_applications.sql','utf8')}`);if(process.env.APPLICATION_TEST_BASELINE!=='1'){
 await sql(readFileSync('supabase/migrations/20260914132132_business_application_intake_integrity.sql','utf8'))
 await sql(`create schema auth;create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create table profiles(id uuid primary key,email text);insert into profiles values('20000000-0000-4000-8000-000000000001','reviewer@example.test'),('20000000-0000-4000-8000-000000000002','other@example.test');create table program_memberships(program_id uuid,profile_id uuid,role text,status text);insert into program_memberships values('${p}','20000000-0000-4000-8000-000000000001','program-admin','active');create function is_platform_admin() returns boolean language sql as $$select false$$;`)
 await sql(readFileSync('supabase/migrations/20260914133201_business_application_review.sql','utf8'))
 await sql(readFileSync('supabase/migrations/20260914133559_business_application_notification_outbox.sql','utf8'))
}})
after(()=>db.drop())
test('simultaneous requests return one reference and one immutable event',async()=>{const key=randomUUID();const results=await Promise.all(Array.from({length:5},()=>sql(submit(key))));assert.equal(new Set(results.map(r=>JSON.parse(r).reference)).size,1);assert.equal(await sql(`select count(*) from business_application_intents where request_id='${key}'`),'1')})
test('same identity binds exact payload; conflict leaves original intact',async()=>{const key=randomUUID();await sql(submit(key));await assert.rejects(sql(submit(key,{...payload,legal_name:'Changed'})),/payload_conflict/);assert.equal(await sql(`select payload->>'legal_name' from business_application_intents where request_id='${key}'`),'Test Co')})
test('anonymous/authenticated cannot insert or call intake',async()=>{for(const role of ['anon','authenticated']){await assert.rejects(sql(`set role ${role};select * from business_application_intents`),/permission denied/);await assert.rejects(sql(`set role ${role};select public.submit_business_application_intent('${p}','${randomUUID()}','{}','${'b'.repeat(64)}',10)`),/permission denied/)}})
test('stale acknowledgement fails with no application',async()=>{const key=randomUUID();await assert.rejects(sql(submit(key,{...payload,disclosure_version:'invented'})),/acknowledgement/);assert.equal(await sql(`select count(*) from business_application_intents where request_id='${key}'`),'0')})
test('rate limiting is atomic but committed replay remains available',async()=>{const source='c'.repeat(64),key=randomUUID();const first=JSON.parse(await sql(submit(key,payload,source,1)));await assert.rejects(sql(submit(randomUUID(),payload,source,1)),/rate_limit/);assert.equal(JSON.parse(await sql(submit(key,payload,source,1))).reference,first.reference)})
test('evidence cannot be rewritten or deleted',async()=>{await assert.rejects(sql('update business_application_intents set payload=\'{}\''),/immutable/);await assert.rejects(sql('delete from business_application_intents'),/immutable/)})

test('scoped reviewer transitions once; unrelated actor and stale concurrent review fail',async()=>{
 const key=randomUUID();await sql(submit(key));const id=await sql(`select application_id from business_application_intents where request_id='${key}'`)
 const review=(actor,expected,next)=>sql(`set role authenticated;set request.jwt.claim.sub='${actor}';select (review_business_application('${id}','${expected}','${next}','Fixture review')).status`)
 await assert.rejects(review('20000000-0000-4000-8000-000000000002','submitted','in_review'),/reviewer_required/)
 await review('20000000-0000-4000-8000-000000000001','submitted','in_review')
 const outcomes=await Promise.allSettled([review('20000000-0000-4000-8000-000000000001','in_review','approved'),review('20000000-0000-4000-8000-000000000001','in_review','declined')])
 assert.equal(outcomes.filter(o=>o.status==='fulfilled').length,1)
 assert.equal(await sql(`select count(*) from business_application_review_events where application_id='${id}'`),'2')
 await assert.rejects(sql('delete from business_application_review_events'),/immutable/)
 assert.equal(await sql(`set role authenticated;set request.jwt.claim.sub='20000000-0000-4000-8000-000000000002';select count(*) from business_applications`),'0')
})

test('notification workers claim disjoint leases; delivery retries do not resubmit applications',async()=>{
 const before=await sql('select count(*) from business_applications')
 const claim=()=>sql("set role service_role;select coalesce(json_agg(x),'[]') from claim_business_application_notifications(100) x").then(JSON.parse)
 const [a,b]=await Promise.all([claim(),claim()]);assert.ok(a.length+b.length>0);assert.equal(new Set([...a,...b].map(x=>x.id)).size,a.length+b.length)
 const item=[...a,...b][0]
 assert.equal(await sql(`set role service_role;select finish_business_application_notification('${item.id}','${randomUUID()}','fixture-provider',null)`),'f')
 assert.equal(await sql(`set role service_role;select finish_business_application_notification('${item.id}','${item.lease_id}','fixture-provider',null)`),'t')
 assert.equal(await sql(`set role service_role;select finish_business_application_notification('${item.id}','${item.lease_id}','fixture-provider',null)`),'f')
 assert.equal(await sql('select count(*) from business_applications'),before)
})

test('the submitting representative cannot review their own application',async()=>{
 const key=randomUUID();await sql(submit(key));const id=await sql(`select application_id from business_application_intents where request_id='${key}'`)
 await sql("update profiles set email='test@example.test' where id='20000000-0000-4000-8000-000000000001'")
 await assert.rejects(sql(`set role authenticated;set request.jwt.claim.sub='20000000-0000-4000-8000-000000000001';select review_business_application('${id}','submitted','in_review','Self review')`),/independent_reviewer_required/)
})
