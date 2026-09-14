import { describe, expect, it } from 'vitest'
import { beginVoucherRequest, completeVoucherRequest, readVoucherRequest, voucherRequestKey } from './loyality-voucher-request'
function storage(): Storage {
 const entries = new Map<string,string>()
 return {get length(){return entries.size},clear:()=>entries.clear(),getItem:k=>entries.get(k)??null,key:i=>[...entries.keys()][i]??null,removeItem:k=>{entries.delete(k)},setItem:(k,v)=>{entries.set(k,v)}}
}
describe('durable voucher journal',()=>{
 it('resumes the original identity and blocks conflicting catalogs',()=>{const s=storage();const a=beginVoucherRequest(s,'p:c','a');expect(beginVoucherRequest(s,'p:c','a')).toEqual(a);expect(()=>beginVoucherRequest(s,'p:c','b')).toThrow();expect(readVoucherRequest(s,'p:c')).toEqual(a)})
 it('isolates accounts and programs',()=>{const s=storage();const keys=[voucherRequestKey('p','a'),voucherRequestKey('p','b'),voucherRequestKey('q','a')];expect(new Set(keys.map(k=>beginVoucherRequest(s,k,'a').requestId)).size).toBe(3)})
 it.each(['{','null','{}','{"catalogId":"a","requestId":"invalid"}',''])('never replaces corrupt state: %s',value=>{const s=storage();s.setItem('k',value);expect(()=>beginVoucherRequest(s,'k','a')).toThrow();expect(s.getItem('k')).toBe(value)})
 it('blocks requests when persistence fails',()=>{const s=storage();s.setItem=()=>{throw Error('blocked')};expect(()=>beginVoucherRequest(s,'k','a')).toThrow('blocked')})
 it('only clears the matching identity',()=>{const s=storage();const a=beginVoucherRequest(s,'k','a');completeVoucherRequest(s,'k',{...a,requestId:crypto.randomUUID()});expect(readVoucherRequest(s,'k')).toEqual(a);completeVoucherRequest(s,'k',a);expect(readVoucherRequest(s,'k')).toBeNull()})
})
