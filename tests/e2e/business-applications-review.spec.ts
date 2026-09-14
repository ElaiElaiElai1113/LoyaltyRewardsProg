import {test,expect} from '@playwright/test'
test('reviewer sees pending applications, submits a reason and refreshes the committed state',async({page})=>{
 const app={id:'application-fixture',program_id:'program-fixture',application_reference:'RWD-BIZ-fixture',legal_name:'Fixture Cafe',representative_name:'Fixture Owner',representative_email:'owner@example.test',model:'commission',status:'submitted',created_at:'2026-09-14T00:00:00Z'}
 const events:unknown[]=[]
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());if(!['127.0.0.1','localhost'].includes(u.hostname))return route.abort()
  if(u.pathname==='/src/main.tsx')return route.fulfill({contentType:'text/javascript',body:'import "/tests/e2e/fixtures/loyality-review-harness.tsx"'})
  if(u.pathname==='/__loyality-api/listApplications')return route.fulfill({json:{rows:[app],count:1}})
  if(u.pathname==='/__loyality-api/applicationHistory')return route.fulfill({json:events})
  if(u.pathname==='/__loyality-api/reviewApplication'){const [,next,reason]=route.request().postDataJSON();events.push({id:'event-fixture',from_status:app.status,to_status:next,reason,created_at:'2026-09-14T00:00:00Z'});app.status=next;return route.fulfill({json:{ok:true}})}
  return route.continue()
 })
 await page.goto('/admin/applications');await page.getByRole('button',{name:/Fixture Cafe/}).click();await expect(page.getByRole('button',{name:'in_review',exact:true})).toBeDisabled();await page.getByLabel('Review reason').fill('Fixture intake checked');await page.getByRole('button',{name:'in_review',exact:true}).click();await expect(page.getByRole('button',{name:/RWD-BIZ-fixture · in_review/})).toBeVisible();expect(events).toHaveLength(1);await page.getByRole('button',{name:/Fixture Cafe/}).click();await expect(page.getByText(/Fixture intake checked/)).toBeVisible();await expect(page.getByText('Approval records a review decision only. Activation remains pending accepted commercial terms.')).toBeVisible()
})
