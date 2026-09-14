type JournalStorage = Pick<Storage,'getItem'|'setItem'>
export type ApplicationRequest = {requestId:string;payload:Record<string,unknown>}
export function readApplicationRequest(storage: JournalStorage,key:string):ApplicationRequest|null {
 const value=storage.getItem(key);if(value===null)return null
 const saved=JSON.parse(value) as ApplicationRequest
 if(!saved || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved.requestId) || !saved.payload || typeof saved.payload!=='object')throw Error('Your saved application could not be read. Contact support before submitting again.')
 return saved
}
export function beginApplicationRequest(storage:JournalStorage,key:string,payload:Record<string,unknown>):ApplicationRequest {
 const saved=readApplicationRequest(storage,key)
 if(saved){if(JSON.stringify(saved.payload)!==JSON.stringify(payload))throw Error('An application is awaiting confirmation. Retry its original details.');return saved}
 const next={requestId:crypto.randomUUID(),payload};storage.setItem(key,JSON.stringify(next));return next
}
