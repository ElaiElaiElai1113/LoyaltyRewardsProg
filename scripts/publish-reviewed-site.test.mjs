import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import { publishReviewedSite, readCandidateHealth, vercelArguments, scope, targets, teamId, protectedMappings } from './publish-reviewed-site.mjs'

const sha = 'a'.repeat(40)
function harness(target = 'rewardme', options = {}) {
  const config = targets[target], commands = [], evidence = []
  const aliases = new Map(Object.values(targets).flatMap(t => t.aliases.map(alias => [alias, {alias,projectId:t.projectId,deploymentId:'dpl_old',redirect:null}])))
  for (const [alias, projectId, deploymentId] of [
    ['wondertown-rewards.vercel.app',targets.rewardme.projectId,protectedMappings['wondertown-rewards.vercel.app'].deploymentId],
    ['pinas-rewards.vercel.app',targets.rewardme.projectId,protectedMappings['pinas-rewards.vercel.app'].deploymentId],
    ['guatemalarewards.com','prj_guatemala','dpl_guatemala'],
    ['www.medellinrewards.com','prj_medellin','dpl_medellin'],
    ['innerfire.example','prj_innerfire','dpl_innerfire'],
  ]) aliases.set(alias,{alias,projectId,deploymentId,redirect:null})
  let aliasReads = 0, staged = false
  const run = async args => {
    commands.push(args)
    if (args[0] === 'api') {
      const url = new URL(args[1], 'https://api.vercel.com')
      assert.equal(url.searchParams.get('teamId'), teamId)
      if(url.pathname.startsWith('/v9/projects/'))return JSON.stringify({id:config.projectId,name:config.project,accountId:teamId,...options.project})
      if(url.pathname==='/v4/aliases') {
        if(options.assignedRace&&[...aliases.values()].some(a=>a.deploymentId==='dpl_candidate'))aliases.get(config.aliases[0]).deploymentId='dpl_external'
        const records=[...aliases.values()]
        return JSON.stringify(url.searchParams.has('until')?{aliases:records.slice(6),pagination:{next:null}}:{aliases:records.slice(0,6),pagination:{next:100}})
      }
      if(url.pathname.startsWith('/v4/aliases/')){
        aliasReads++
        if(options.race&&staged&&aliasReads>config.aliases.length)aliases.get(config.aliases[0]).deploymentId='dpl_external'
        return JSON.stringify(aliases.get(decodeURIComponent(url.pathname.split('/').at(-1))))
      }
      if(url.pathname.startsWith('/v13/deployments/'))return JSON.stringify({id:'dpl_candidate',projectId:config.projectId,readyState:'READY',target:'production',meta:{githubCommitSha:sha},...options.candidate})
      throw new Error('Unexpected API path')
    }
    if(args[0]==='deploy') {
      staged=true
      if(options.protectedDrift)aliases.get('pinas-rewards.vercel.app').deploymentId='dpl_external'
      return 'https://reviewed-candidate.vercel.app'
    }
    if(args[0]==='alias'){
      assert.equal(args[1],'set');assert(config.aliases.includes(args[3]))
      if(options.aliasFailure)throw new Error('assignment failed')
      aliases.get(args[3]).deploymentId='dpl_candidate'
      if(options.timeoutAfterSecondWrite&&commands.filter(command=>command[0]==='alias').length===2)throw new Error('alias timeout after remote write')
      return ''
    }
    throw new Error('Unexpected mutation')
  }
  return {aliases,commands,evidence,run,health:async()=>({ok:true,status:'ready',database:'reachable',sourceRevision:sha,projectRef:config.backend,...options.health}),record:async state=>evidence.push(structuredClone(state))}
}

for(const target of ['rewardme','loyality'])test(`${target}: stages exact source and publishes only its allowlist, preserving every other mapping`,async()=>{
  const h=harness(target),before=structuredClone(h.aliases)
  const result=await publishReviewedSite({target,sha},h)
  assert.equal(result.phase,'complete')
  const deploy=h.commands.find(args=>args[0]==='deploy')
  assert.deepEqual(deploy,['deploy','--prod','--skip-domain','--yes','--force','--project',targets[target].project,'--env',`REWARDS_SOURCE_COMMIT=${sha}`,'--meta',`githubCommitSha=${sha}`])
  assert.deepEqual(h.commands.filter(args=>args[0]==='alias').map(args=>args[3]),targets[target].aliases)
  for(const [alias,mapping] of before)if(!targets[target].aliases.includes(alias))assert.deepEqual(h.aliases.get(alias),mapping)
  assert(h.commands.every(args=>['api','deploy','alias'].includes(args[0])))
  assert(h.commands.filter(args=>args[0]==='api'&&args[1].includes('/v4/aliases?')).some(args=>args[1].includes('until=100')))
})

for(const [label,options] of [
  ['wrong project',{project:{id:'prj_unrelated'}}],['wrong team',{project:{accountId:'team_other'}}],
  ['candidate source mismatch',{candidate:{meta:{githubCommitSha:'b'.repeat(40)}}}],
  ['candidate not ready',{candidate:{readyState:'ERROR'}}],['candidate wrong project',{candidate:{projectId:'prj_unrelated'}}],
  ['wrong backend',{health:{projectRef:'wrong'}}],['wrong health source',{health:{sourceRevision:'b'.repeat(40)}}],
  ['database unavailable',{health:{database:'unreachable'}}],['protected alias drift',{protectedDrift:true}],
  ['allowed alias changes before assignment',{race:true}],
])test(`fails closed with no alias writes: ${label}`,async()=>{
  const h=harness('rewardme',options)
  await assert.rejects(publishReviewedSite({target:'rewardme',sha},h))
  assert.equal(h.commands.filter(args=>args[0]==='alias').length,0)
  assert(h.evidence.at(-1).error)
})

test('refuses unexpected alias ownership before even staging',async()=>{
  const h=harness();h.aliases.get('myrewardme.com').projectId='prj_other'
  await assert.rejects(publishReviewedSite({target:'rewardme',sha},h),/Unapproved alias mapping/)
  assert.equal(h.commands.filter(args=>args[0]==='deploy').length,0)
})

test('rejects unapproved target and abbreviated source without any subprocess',async()=>{
  const h=harness()
  await assert.rejects(publishReviewedSite({target:'guatemala',sha},h),/Only rewardme or loyality/)
  await assert.rejects(publishReviewedSite({target:'rewardme',sha:'aaaaaaa'},h),/full 40-character/)
  assert.equal(h.commands.length,0)
})

test('assignment failure records state and never falls back to broad promotion or rollback',async()=>{
  const h=harness('rewardme',{aliasFailure:true})
  await assert.rejects(publishReviewedSite({target:'rewardme',sha},h),/assignment failed/)
  assert.equal(h.evidence.at(-1).phase,'assign')
  assert.equal(h.evidence.at(-1).error,'assignment failed')
  assert.equal(h.evidence.at(-1).pendingAlias,'myrewardme.com')
  assert(h.commands.every(args=>!args.includes('promote')&&!args.includes('rollback')&&!args.includes('env')))
})

test('second alias timeout after remote write records uncertain mapping and stops bounded recovery',async()=>{
  const h=harness('rewardme',{timeoutAfterSecondWrite:true})
  await assert.rejects(publishReviewedSite({target:'rewardme',sha},h),/timeout after remote write/)
  const state=h.evidence.at(-1)
  assert.deepEqual(state.assigned,['myrewardme.com'])
  assert.equal(state.pendingAlias,'www.myrewardme.com')
  assert.equal(state.phase,'assign')
  assert.equal(state.candidate,'https://reviewed-candidate.vercel.app')
  assert.equal(h.aliases.get('myrewardme.com').deploymentId,'dpl_candidate')
  assert.equal(h.aliases.get('www.myrewardme.com').deploymentId,'dpl_candidate')
  assert.equal(h.aliases.get('rewardme-prod.vercel.app').deploymentId,'dpl_old')
  assert.equal(h.aliases.get('pinas-rewards.vercel.app').deploymentId,protectedMappings['pinas-rewards.vercel.app'].deploymentId)
  assert.equal(h.commands.filter(command=>command[0]==='alias').length,2)
  assert(h.commands.every(command=>!command.includes('promote')&&!command.includes('rollback')))
})

for(const kind of ['401','non-JSON','redirect'])test(`immutable health ${kind} refuses alias writes without bypassing protection`,async()=>{
  const h=harness()
  h.health=origin=>readCandidateHealth(origin,async args=>{
    assert.equal(args[0],'curl');assert.equal(args[1],'/api/health');assert.equal(args[3],origin)
    assert(args.includes('--fail'));assert(!args.includes('--location'));assert(!args.includes('-L'))
    if(kind==='401')throw new Error('Vercel curl failed (HTTP 401)')
    return kind==='redirect'?'redirect\n302 text/plain':'<html>login</html>\n200 text/html'
  },'/local/linked-health')
  await assert.rejects(publishReviewedSite({target:'rewardme',sha},h),kind==='401'?/HTTP 401/:/requires HTTP 200 JSON/)
  assert.equal(h.commands.filter(command=>command[0]==='alias').length,0)
})

test('authenticated health uses linked cwd and environment auth without forwarding Vercel flags to curl',async()=>{
  const status={ok:true,sourceRevision:sha}
  const health=await readCandidateHealth('https://reviewed-candidate.vercel.app',async(args,options)=>{
    const command=vercelArguments(args,'test-token'),separator=command.indexOf('--')
    assert.equal(options.cwd,'/local/linked-health')
    assert(separator>0)
    assert(!command.includes('--scope'));assert(!command.includes('--token'));assert(!command.includes('--cwd'));assert(!command.includes('test-token'))
    assert.equal(command.at(-1),'\n%{http_code} %{content_type}')
    return JSON.stringify(status)+'\n200 application/json; charset=utf-8'
  },'/local/linked-health')
  assert.deepEqual(health,status)
  assert.deepEqual(vercelArguments(['api','/v9/projects/example'],'test-token'),['api','/v9/projects/example','--scope',scope,'--token','test-token'])
  await assert.rejects(readCandidateHealth('https://reviewed-candidate.vercel.app',async()=>'<html>\n200 application/json','/local/linked-health'),/invalid JSON/)
})

for(const host of Object.keys(protectedMappings))for(const kind of ['missing','wrong project','wrong deployment'])test(`refuses audited protected pin ${host} ${kind} before staging`,async()=>{
  const h=harness()
  if(kind==='missing')h.aliases.delete(host)
  else h.aliases.get(host)[kind==='wrong project'?'projectId':'deploymentId']='unexpected'
  await assert.rejects(publishReviewedSite({target:'rewardme',sha},h),/Protected alias pin drift/)
  assert.equal(h.commands.filter(args=>args[0]==='deploy').length,0)
})

test('previously assigned alias drift stops subsequent assignments',async()=>{
  const h=harness('rewardme',{assignedRace:true})
  await assert.rejects(publishReviewedSite({target:'rewardme',sha},h),/Published alias drift/)
  assert.equal(h.commands.filter(args=>args[0]==='alias').length,1)
})

test('real CLI provenance gate rejects untracked deployable inputs and tracked edits before any authenticated command',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'rewardme-provenance-'))
  try {
    const git=args=>execFileSync('git',['-C',directory,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()
    git(['init','--quiet'])
    await writeFile(join(directory,'source.txt'),'reviewed source')
    git(['add','source.txt'])
    git(['-c','user.name=WorkflowContract','-c','user.email=workflow-contract@example.invalid','-c',`core.hooksPath=${directory}`,'commit','--quiet','--no-gpg-sign','-m','provenance fixture'])
    const actualSha=git(['rev-parse','HEAD'])
    const invoke=()=>spawnSync(process.execPath,[fileURLToPath(new URL('./publish-reviewed-site.mjs',import.meta.url)),'rewardme',actualSha,'artifacts/evidence.json'],{cwd:directory,encoding:'utf8',env:{...process.env,VERCEL_TOKEN:''}})
    const clean=invoke();assert.equal(clean.status,1);assert.match(clean.stderr,/VERCEL_TOKEN required/)
    await mkdir(join(directory,'api'));await writeFile(join(directory,'api','unreviewed.ts'),'unreviewed deployable input')
    const untracked=invoke();assert.equal(untracked.status,1);assert.match(untracked.stderr,/clean checkout without untracked source/)
    git(['add','api/unreviewed.ts']);git(['-c','user.name=WorkflowContract','-c','user.email=workflow-contract@example.invalid','-c',`core.hooksPath=${directory}`,'commit','--quiet','--no-gpg-sign','-m','new fixture source'])
    await writeFile(join(directory,'source.txt'),'dirty source')
    const dirty=spawnSync(process.execPath,[fileURLToPath(new URL('./publish-reviewed-site.mjs',import.meta.url)),'rewardme',git(['rev-parse','HEAD']),'artifacts/evidence.json'],{cwd:directory,encoding:'utf8',env:{...process.env,VERCEL_TOKEN:''}})
    assert.equal(dirty.status,1);assert.match(dirty.stderr,/clean checkout without untracked source/)
  } finally {
    if(!resolve(directory).startsWith(resolve(tmpdir())+'\\rewardme-provenance-')&&!resolve(directory).startsWith(resolve(tmpdir())+'/rewardme-provenance-'))throw new Error('Unsafe temporary cleanup path')
    await rm(directory,{recursive:true,force:true})
  }
})
