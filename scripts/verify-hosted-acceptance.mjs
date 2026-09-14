export function validateHostedAcceptance(env){
 const required=['E2E_BASE_URL','E2E_APPROVED_PROJECT_REF','E2E_APPROVED_APP_REVISION','E2E_FIXTURE_CLEANUP_PLAN','E2E_APPROVED_TEST_ACCOUNTS']
 for(const key of required) if(!env[key]?.trim())throw Error(`${key} must be explicitly supplied for hosted acceptance.`)
 const url=new URL(env.E2E_BASE_URL)
 if(url.protocol!=='https:'||url.username||url.password)throw Error('Hosted acceptance requires an explicit HTTPS origin.')
 if(env.E2E_ALLOW_HOSTED_MUTATIONS!=='true')throw Error('Hosted mutation approval is required.')
 if(!/^[a-z]{20}$/.test(env.E2E_APPROVED_PROJECT_REF)||!/^[a-f0-9]{40}$/i.test(env.E2E_APPROVED_APP_REVISION))throw Error('Approved project/revision is invalid.')
 const project=new URL(env.SUPABASE_URL??env.VITE_SUPABASE_URL??'').hostname.split('.')[0]
 if(project!==env.E2E_APPROVED_PROJECT_REF)throw Error('Configured project does not match approval.')
 return url.origin
}
export async function verifyHostedAcceptance(env=process.env,fetcher=fetch){
 const origin=validateHostedAcceptance(env)
 const response=await fetcher(`${origin}/api/health`,{redirect:'error'})
 if(!response.ok)throw Error('Approved application is not healthy.')
 const health=await response.json()
 if(health.sourceRevision!==env.E2E_APPROVED_APP_REVISION||health.projectRef!==env.E2E_APPROVED_PROJECT_REF)throw Error('Hosted revision/project does not match approval. No fixture changes were made.')
}
export default async function globalSetup(){await verifyHostedAcceptance()}

export function assertApprovedTestAccounts(accounts,env=process.env){
 const approved=new Set((env.E2E_APPROVED_TEST_ACCOUNTS??'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean))
 if(accounts.some(email=>!approved.has(email.toLowerCase())))throw Error('The suite uses accounts outside the explicit approval list.')
}
