import { expect,it } from 'vitest'
import { beginApplicationRequest } from './business-application-request'
it('resumes the original payload after a lost response and rejects changed details',()=>{
 const entries=new Map<string,string>();const storage={getItem:(k:string)=>entries.get(k)??null,setItem:(k:string,v:string)=>{entries.set(k,v)}}
 const original=beginApplicationRequest(storage,'p',{legalName:'Original'});expect(beginApplicationRequest(storage,'p',{legalName:'Original'})).toEqual(original)
 expect(()=>beginApplicationRequest(storage,'p',{legalName:'Changed'})).toThrow()
})
