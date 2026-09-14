import { existsSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
export const expectedProjectRef = 'bftuvmywtmpflizsomim'
export function verifyTarget(target) {
 const errors=[]
 for(const key of ['clientUrl','serverUrl']) {
  try { const u=new URL(target[key]); if(u.protocol!=='https:' || u.hostname!==`${expectedProjectRef}.supabase.co` || u.username || u.password) errors.push(`${key} does not match the approved project.`) }
  catch {errors.push(`${key} is missing or invalid.`)}
 }
 for(const key of ['linkedRef','releaseRef']) if(target[key]?.trim()!==expectedProjectRef) errors.push(`${key} does not match the approved project.`)
 return errors
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 const env={}
 for(const f of ['.env','.env.local']) if(existsSync(f)) for(const line of readFileSync(f,'utf8').split(/\r?\n/)){const m=line.match(/^([A-Z_]+)\s*=\s*(.*?)\s*$/);if(m)env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}
 Object.assign(env,process.env)
 const errors=verifyTarget({clientUrl:env.VITE_SUPABASE_URL,serverUrl:env.SUPABASE_URL??env.VITE_SUPABASE_URL,linkedRef:readFileSync('supabase/.temp/project-ref','utf8'),releaseRef:JSON.parse(readFileSync('ops/migration-release.json','utf8')).projectRef})
 if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log(`Verified client, server, CLI and release target: ${expectedProjectRef}`)
}
