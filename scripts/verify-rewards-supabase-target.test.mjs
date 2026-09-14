import assert from 'node:assert/strict'
import { test } from 'node:test'
import { verifyTarget } from './verify-rewards-supabase-target.mjs'
const ref='bftuvmywtmpflizsomim'
const valid={clientUrl:`https://${ref}.supabase.co`,serverUrl:`https://${ref}.supabase.co`,linkedRef:ref,releaseRef:ref}
test('accepts aligned project refs without keys',()=>assert.deepEqual(verifyTarget(valid),[]))
for(const field of Object.keys(valid)) test(`rejects mismatched ${field}`,()=>assert.ok(verifyTarget({...valid,[field]:'https://retfuxpfstatpdsunkgj.supabase.co'}).length))
test('rejects malformed and missing target URLs',()=>{assert.ok(verifyTarget({...valid,clientUrl:''}).length);assert.ok(verifyTarget({...valid,serverUrl:'invalid'}).length)})
