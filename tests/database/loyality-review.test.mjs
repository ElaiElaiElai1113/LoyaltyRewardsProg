import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fixtureSql, seedSql, ids as i } from './loyality-fixture.mjs';

// Deliberately no DATABASE_URL support: this runner can only create a disposable
// database on loopback. Never feed it a hosted service-role key or production DB.
const psql = process.env.LOYALITY_TEST_PSQL || 'psql';
const port = process.env.LOYALITY_TEST_PGPORT || '5432';
const user = process.env.LOYALITY_TEST_PGUSER || 'postgres';
const database = `loyality_review_${process.pid}_${Date.now()}`;
const baseline = process.env.LOYALITY_TEST_BASELINE === '1';
const migrationName = readdirSync('supabase/migrations').find(n => n.endsWith('_loyality_review_integrity_and_retry.sql'));
const migration = readFileSync(`supabase/migrations/${migrationName}`, 'utf8');
function sql(command, db = database) {
  return new Promise((resolve, reject) => {
    const child = spawn(psql, ['-X','-qAt','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-h','127.0.0.1','-p',port,'-U',user,'-d',db], { windowsHide: true });
    let out = '', error = '';
    child.stdout.on('data', b => { out += b; });
    child.stderr.on('data', b => { error += b; });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(out.trim()) : reject(new Error(error.trim())));
    child.stdin.end(`set statement_timeout='15s'; set request.jwt.claim.role='service_role'; ${command}`);
  });
}
function asActor(actor, command, db = database) {
  const claims = JSON.stringify({ sub: i[actor], role: 'authenticated', app_metadata: {
    role: actor === 'owner' ? 'business-owner' : actor === 'staff' ? 'business-staff' : 'customer', business_id: i.businessA,
  } });
  return sql(`begin; set local role authenticated; set local request.jwt.claim.role='authenticated';
    set local request.jwt.claims='${claims}'; ${command}; commit;`, db);
}
const id = { offer: 'a1000000-0000-4000-8000-000000000001', rule: 'a1000000-0000-4000-8000-000000000002',
  catalog: 'a1000000-0000-4000-8000-000000000003', raffle: 'a1000000-0000-4000-8000-000000000004' };
const config = [
  ['loyality_offers', 'title,reward_title', "'Offer','Gift'", id.offer],
  ['loyality_visit_rules', 'name,trigger_visit_count,reward_title', "'Rule',2,'Gift'", id.rule],
  ['loyality_voucher_catalog', 'title,points_cost', "'Catalog',100", id.catalog],
  ['loyality_raffles', 'title,prize_description,ends_at', "'Raffle','Prize',now()+interval '1 day'", id.raffle],
];
const redeem = request => `select id from public.redeem_loyality_catalog_voucher('${id.catalog}','${request}')`;
const sale = (receipt, request = randomUUID(), member = 'member') => `select id from public.record_member_transaction('qr-${member}',100,'${receipt}',null,'${request}')`;
before(async () => {
  await sql(`do $$ begin
    if not exists(select from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
    if not exists(select from pg_roles where rolname='anon') then create role anon nologin; end if;
    if not exists(select from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
  end $$; create database ${database};`, 'postgres');
  await sql(fixtureSql());
  await sql(seedSql());
  if (!baseline) {
    assert.ok(migration.trim(), 'Repair migration must not be empty');
    await sql(`begin; ${migration} commit;`);
  }
});
after(async () => { await sql(`drop database if exists ${database} with (force);`, 'postgres'); });
beforeEach(async () => {
  await sql(`truncate public.loyality_offer_claims, public.loyality_vouchers, public.loyality_visits,
    public.loyality_raffle_entries, public.loyality_offers, public.loyality_visit_rules,
    public.loyality_voucher_catalog, public.loyality_raffles, public.member_transactions cascade;
    update public.program_memberships set status='active'; update public.reward_balances set points=1000;
    ${config.map(([t,c,v,key])=>`insert into public.${t}(id,program_id,business_id,${c}) values ('${key}','${i.programA}','${i.businessA}',${v});`).join('\n')}`);
});

for (const [table, cols, vals, key] of config) {
  test(`${table}: owner writes, cross-program insert/update denied`, async () => {
    await asActor('owner', `insert into public.${table}(program_id,business_id,${cols}) values ('${i.programA}','${i.businessA}',${vals})`);
    await assert.rejects(asActor('owner', `insert into public.${table}(program_id,business_id,${cols}) values ('${i.programB}','${i.businessA}',${vals})`), /program|foreign key|permission/i);
    await assert.rejects(asActor('owner', `update public.${table} set program_id='${i.programB}' where id='${key}'`), /program|foreign key|permission/i);
  });
  test(`${table}: staff cannot insert, update or delete directly`, async () => {
    await assert.rejects(asActor('staff', `insert into public.${table}(program_id,business_id,${cols}) values ('${i.programA}','${i.businessA}',${vals})`), /policy|permission/i);
    const touched = await asActor('staff', `with changed as (update public.${table} set business_id=business_id where id='${key}' returning id) select count(*) from changed`);
    assert.equal(touched, '0');
    assert.equal(await asActor('staff', `with changed as (delete from public.${table} where id='${key}' returning id) select count(*) from changed`), '0');
    assert.equal(await sql(`select count(*) from public.${table} where id='${key}'`), '1');
  });
}
test('current membership overrides stale owner/staff JWT claims', async () => {
  await sql(`update public.program_memberships set status='suspended' where profile_id in ('${i.owner}','${i.staff}')`);
  await assert.rejects(asActor('owner', `insert into public.loyality_offers(program_id,business_id,title,reward_title) values ('${i.programA}','${i.businessA}','Bad','Bad')`), /policy|permission/i);
  await assert.rejects(asActor('staff', sale('suspended')), /Permission denied/);
  const voucher = await asActor('member', redeem(randomUUID()));
  const token = await sql(`select public_token from public.loyality_vouchers where id='${voucher}'`);
  await assert.rejects(asActor('staff', `select id from public.redeem_loyality_voucher('${token}')`), /cannot redeem|permission/i);
});
test('program admin and platform admin can configure; unrelated member cannot', async () => {
  for (const actor of ['admin','platformAdmin']) await asActor(actor, `update public.loyality_voucher_catalog set points_cost=120 where id='${id.catalog}'`);
  assert.equal(await sql(`select points_cost from public.loyality_voucher_catalog where id='${id.catalog}'`), '120');
  await assert.rejects(asActor('memberB', `insert into public.loyality_voucher_catalog(program_id,business_id,title,points_cost) values ('${i.programA}','${i.businessA}','Bad',0)`), /policy|permission/i);
});
test('catalog redemption checks active member and does not deduct another program balance', async () => {
  await assert.rejects(asActor('memberB', redeem(randomUUID())), /program|member/i);
  await sql(`update public.program_memberships set status='suspended' where profile_id='${i.member}'`);
  await assert.rejects(asActor('member', redeem(randomUUID())), /program|member/i);
  assert.equal(await sql('select sum(points) from public.reward_balances'), '2000');
});
test('lost committed response replay survives inactive catalog and insufficient remaining points', async () => {
  await sql(`update public.reward_balances set points=100 where profile_id='${i.member}'`);
  const request = randomUUID();
  const committed = await asActor('member', redeem(request)); // response discarded by client
  await sql(`update public.loyality_voucher_catalog set active=false where id='${id.catalog}'`);
  assert.equal(await asActor('member', redeem(request)), committed);
  assert.equal(await sql(`select points from public.reward_balances where profile_id='${i.member}'`), '0');
  assert.equal(await sql('select count(*) from public.loyality_vouchers'), '1');
});
test('simultaneous identical catalog requests replay atomically', async () => {
  // Widen the original replay-before-balance-lock race without replacing logic.
  await sql(`create function public.test_slow_balance() returns trigger language plpgsql as $$ begin perform pg_sleep(0.25); return new; end $$;
    create trigger test_slow_balance before update on public.reward_balances for each row execute function public.test_slow_balance();`);
  try {
    const request = randomUUID();
    const results = await Promise.all([asActor('member', redeem(request)), asActor('member', redeem(request))]);
    assert.equal(results[0], results[1]);
    assert.equal(await sql(`select points from public.reward_balances where profile_id='${i.member}'`), '900');
    assert.equal(await sql('select count(*) from public.loyality_vouchers'), '1');
  } finally { await sql('drop trigger test_slow_balance on public.reward_balances; drop function public.test_slow_balance();'); }
});
test('same redemption request cannot be reused for another catalog item', async () => {
  const request = randomUUID();
  await asActor('member', redeem(request));
  const other = await sql(`insert into public.loyality_voucher_catalog(program_id,business_id,title,points_cost) values ('${i.programA}','${i.businessA}','Other',20) returning id`);
  await assert.rejects(asActor('member', `select id from public.redeem_loyality_catalog_voucher('${other}','${request}')`), /request.*(used|different)/i);
  await assert.rejects(asActor('member', `select id from public.redeem_loyality_catalog_voucher(null,'${request}')`), /request.*(used|different)/i);
});
test('only confirmed new-request rejection uses the no-commit SQLSTATE', async () => {
  await sql(`update public.loyality_voucher_catalog set active=false where id='${id.catalog}'`);
  await assert.rejects(asActor('member',redeem(randomUUID())),/LY001/);
  await sql(`update public.loyality_voucher_catalog set active=true where id='${id.catalog}'; update public.reward_balances set points=0 where profile_id='${i.member}'`);
  await assert.rejects(asActor('member',redeem(randomUUID())),/LY001/);
  assert.equal(await sql('select count(*) from public.loyality_vouchers'),'0');
  await sql(`update public.reward_balances set points=100 where profile_id='${i.member}'`);
  const request = randomUUID();
  await asActor('member',redeem(request));
  await sql(`update public.program_memberships set status='suspended' where profile_id='${i.member}'`);
  await assert.rejects(asActor('member',redeem(request)),/P0001/);
  assert.equal(await sql('select count(*) from public.loyality_vouchers'),'1');
});
test('concurrent distinct sales number visits and issue every side effect exactly once', async () => {
  await sql(`update public.loyality_visit_rules set trigger_visit_count=1,repeat_every=null;
    insert into public.loyality_visit_rules(program_id,business_id,name,trigger_visit_count,repeat_every,reward_title)
    values ('${i.programA}','${i.businessA}','Repeating',2,2,'Repeat');
    create function public.test_slow_visit() returns trigger language plpgsql as $$ begin perform pg_sleep(0.3); return new; end $$;
    create trigger test_slow_visit before insert on public.loyality_visits for each row execute function public.test_slow_visit();`);
  try {
    const requests = [randomUUID(),randomUUID()];
    const receipts = ['concurrent-one','concurrent-two'];
    const results = await Promise.all(requests.map((r,n)=>asActor(n ? 'owner':'staff', sale(receipts[n],r))));
    assert.notEqual(results[0],results[1]);
    for (let n=0;n<2;n++) assert.equal(await asActor(n ? 'owner':'staff', sale(receipts[n],requests[n])), results[n]);
    await asActor('staff', sale('third'));
    await asActor('staff', sale('fourth'));
    assert.equal(await sql('select string_agg(visit_number::text,\',\' order by visit_number) from public.loyality_visits'), '1,2,3,4');
    assert.equal(await sql('select count(*) from public.member_transactions'), '4');
    assert.equal(await sql(`select points from public.reward_balances where profile_id='${i.member}'`), '1040');
    assert.equal(await sql("select count(*) from public.loyality_vouchers where source_kind='visit_rule'"), '3');
    assert.equal(await sql('select count(*) from public.loyality_raffle_entries'), '4');
    assert.equal(await sql('select sum(entry_count) from public.loyality_raffle_entries'), '4');
    await assert.rejects(asActor('staff', sale(' CONCURRENT-ONE ')), /receipt.*already been recorded/i);
    await assert.rejects(asActor('staff', sale('different',requests[0])), /request.*different/i);
  } finally { await sql('drop trigger test_slow_visit on public.loyality_visits; drop function public.test_slow_visit();'); }
});
test('unrelated uniqueness failure is not mislabeled as a duplicate receipt', async () => {
  await sql(`create function public.test_unique_failure() returns trigger language plpgsql as $$ begin
    raise unique_violation using message='Unrelated uniqueness sentinel',constraint='test_unrelated_key'; end $$;
    create trigger test_unique_failure before insert on public.loyality_visits for each row execute function public.test_unique_failure();`);
  try { await assert.rejects(asActor('staff',sale('unique-check')), /Unrelated uniqueness sentinel/); }
  finally { await sql('drop trigger test_unique_failure on public.loyality_visits; drop function public.test_unique_failure();'); }
});
test('staff redeem claimed voucher once and referral award goes to its program member', async () => {
  const token = await sql(`select public_token from public.loyality_offers where id='${id.offer}'`);
  const claim = await asActor('member', `select public_token from public.claim_loyality_offer('${token}','REFERRER','qr-source')`);
  await asActor('staff', `select id from public.redeem_loyality_voucher('${claim}')`);
  await assert.rejects(asActor('staff', `select id from public.redeem_loyality_voucher('${claim}')`), /not active/);
  assert.equal(await sql(`select count(*) from public.loyality_vouchers where source_kind='referral' and customer_id='${i.referrer}' and program_id='${i.programA}'`),'1');
  assert.equal(await sql('select source_label from public.loyality_offer_claims'), 'qr-source');
});
test('related customer, source, event and business relationships are enforced even for privileged writes', async () => {
  await assert.rejects(sql(`insert into public.loyality_offer_claims(program_id,business_id,offer_id,customer_id) values ('${i.programB}','${i.businessB}','${id.offer}','${i.memberB}')`), /reference|program|foreign key/i);
  await assert.rejects(sql(`insert into public.loyality_offer_claims(program_id,business_id,offer_id,customer_id) values ('${i.programA}','${i.businessA}','${id.offer}','${i.memberB}')`), /member|customer|program/i);
  const transaction = await asActor('staff',sale('source-transaction'));
  await assert.rejects(sql(`insert into public.loyality_vouchers(program_id,business_id,customer_id,title,source_kind,source_id,source_event_id) values ('${i.programA}','${i.businessA}','${i.referrer}','Bad','visit_rule','${id.rule}','${transaction}')`), /reference|source|customer/i);
  await assert.rejects(sql(`update public.loyality_raffle_entries set customer_id='${i.referrer}' where member_transaction_id='${transaction}'`), /reference|customer|foreign key/i);
  await assert.rejects(sql(`update public.businesses set program_id='${i.programB}' where id='${i.businessA}'`), /reference|program|foreign key/i);
});
test('all nine Loyality tables reject changing a row to another business', async () => {
  await asActor('staff',sale('all-tables'));
  const token = await sql(`select public_token from public.loyality_offers where id='${id.offer}'`);
  await asActor('member',`select id from public.claim_loyality_offer('${token}')`);
  // Avoid the unrelated settings primary key; this tests the composite FK.
  await sql(`delete from public.loyality_business_settings where business_id='${i.businessB}'`);
  for (const table of ['business_settings','offers','offer_claims','visit_rules','visits','voucher_catalog','vouchers','raffles','raffle_entries']) {
    await assert.rejects(sql(`update public.loyality_${table} set business_id='${i.businessB}' where business_id='${i.businessA}'`), /foreign key|program/i, table);
  }
  await sql(`insert into public.loyality_business_settings(program_id,business_id,public_business_name) values ('${i.programB}','${i.businessB}','B')`);
});
test('concurrent duplicate receipts permit exactly one sale and distinguish the rejection', async () => {
  const results = await Promise.allSettled([asActor('staff',sale('same-receipt')),asActor('owner',sale(' SAME-RECEIPT '))]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  const rejection = results.find(r=>r.status==='rejected');
  assert.match(rejection.reason.message,/receipt.*already been recorded/i);
  assert.equal(await sql('select count(*) from public.member_transactions'),'1');
  assert.equal(await sql('select count(*) from public.loyality_visits'),'1');
  assert.equal(await sql('select count(*) from public.loyality_raffle_entries'),'1');
  assert.equal(await sql(`select points from public.reward_balances where profile_id='${i.member}'`),'1010');
});
test('concurrent identical sale requests return the same sale with one set of side effects', async () => {
  const request = randomUUID();
  const results = await Promise.all([asActor('staff',sale('same-request',request)),asActor('staff',sale('same-request',request))]);
  assert.equal(results[0],results[1]);
  assert.equal(await sql('select count(*) from public.member_transactions'),'1');
  assert.equal(await sql('select count(*) from public.loyality_visits'),'1');
  assert.equal(await sql('select count(*) from public.loyality_raffle_entries'),'1');
  assert.equal(await sql(`select points from public.reward_balances where profile_id='${i.member}'`),'1010');
});
test('anonymous sessions cannot call privileged Loyality RPCs or mutate catalogs', async () => {
  for (const command of [redeem(randomUUID()),"select id from public.claim_loyality_offer('token')","select id from public.redeem_loyality_voucher('token')",
    `insert into public.loyality_offers(program_id,business_id,title,reward_title) values ('${i.programA}','${i.businessA}','Bad','Bad')`]) {
    await assert.rejects(sql(`set role anon; ${command}`),/permission denied/i);
  }
});
test('sales in a tenant without the Loyality flag preserve points without Loyality side effects', async () => {
  await sql(`update public.programs set feature_flags='{}' where id='${i.programA}'`);
  try {
    await Promise.all([asActor('staff',sale('ordinary-one')),asActor('owner',sale('ordinary-two'))]);
    assert.equal(await sql('select count(*) from public.member_transactions'),'2');
    assert.equal(await sql(`select points from public.reward_balances where profile_id='${i.member}'`),'1020');
    for (const table of ['loyality_visits','loyality_vouchers','loyality_raffle_entries']) {
      assert.equal(await sql(`select count(*) from public.${table}`),'0');
    }
  } finally { await sql(`update public.programs set feature_flags='{"loyalitySingleBusiness":true}' where id='${i.programA}'`); }
});
test('migration preflight rejects dirty data atomically and reports the exact row without reassignment', async () => {
  const dirtyDatabase = `${database}_dirty`;
  await sql(`create database ${dirtyDatabase}`,'postgres');
  try {
    await sql(fixtureSql(),dirtyDatabase);
    await sql(seedSql(),dirtyDatabase);
    const dirtyId = await asActor('owner',`insert into public.loyality_voucher_catalog(program_id,business_id,title,points_cost)
      values ('${i.programB}','${i.businessA}','Polluted',50) returning id`,dirtyDatabase);
    const diagnostic = readFileSync('supabase/diagnostics/loyality-integrity-preflight.sql','utf8');
    assert.match(await sql(diagnostic,dirtyDatabase),new RegExp(`${dirtyId}.*business_program_mismatch`));
    await assert.rejects(sql(`begin; ${migration} commit;`,dirtyDatabase),new RegExp(`preflight failed[\\s\\S]*${dirtyId}`));
    assert.equal(await sql(`select program_id::text||':'||business_id::text from public.loyality_voucher_catalog where id='${dirtyId}'`,dirtyDatabase),`${i.programB}:${i.businessA}`);
    assert.equal(await sql("select count(*) from pg_constraint where conname='loyality_business_program_key'",dirtyDatabase),'0');
    // Even the historical vulnerable RPC reproduces the wrong-program deduction.
    await asActor('memberB',`select id from public.redeem_loyality_catalog_voucher('${dirtyId}','${randomUUID()}')`,dirtyDatabase);
    assert.equal(await sql(`select points from public.reward_balances where profile_id='${i.memberB}'`,dirtyDatabase),'950');
  } finally { await sql(`drop database ${dirtyDatabase} with(force)`,'postgres'); }
});
