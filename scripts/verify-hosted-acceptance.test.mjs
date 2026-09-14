import {test} from 'node:test'
import assert from 'node:assert/strict'
import {validateHostedAcceptance,verifyHostedAcceptance} from './verify-hosted-acceptance.mjs'
const env={E2E_BASE_URL:'https://fixture.example.test',E2E_APPROVED_PROJECT_REF:'bftuvmywtmpflizsomim',E2E_APPROVED_APP_REVISION:'a'.repeat(40),E2E_FIXTURE_CLEANUP_PLAN:'dedicated disposable fixtures; reconciliation required',E2E_APPROVED_TEST_ACCOUNTS:'fixture-only roles',E2E_ALLOW_HOSTED_MUTATIONS:'true',SUPABASE_URL:'https://bftuvmywtmpflizsomim.supabase.co'}
test('missing inputs block hosted acceptance',()=>{for(const key of Object.keys(env))assert.throws(()=>validateHostedAcceptance({...env,[key]:''}))})
test('wrong deployed revision prevents mutation preflight',async()=>{await assert.rejects(verifyHostedAcceptance(env,async()=>({ok:true,json:async()=>({sourceRevision:'b'.repeat(40),projectRef:env.E2E_APPROVED_PROJECT_REF})})),/does not match/)})
test('matching app and database target passes read-only preflight',async()=>{await verifyHostedAcceptance(env,async()=>({ok:true,json:async()=>({sourceRevision:env.E2E_APPROVED_APP_REVISION,projectRef:env.E2E_APPROVED_PROJECT_REF})}))})
