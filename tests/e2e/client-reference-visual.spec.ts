import {test,expect,type Page} from '@playwright/test'
const base='http://rewardme.localhost:5177'
async function offline(page:Page){await page.route('**/*',route=>{const host=new URL(route.request().url()).hostname;return host.endsWith('.localhost')||host==='127.0.0.1'||host==='localhost'?route.continue():route.abort()})}
async function fillApplication(page:Page){
 for(const [name,value] of Object.entries({legalName:'Fixture Cafe',industry:'Cafe',street:'Fixture Street',city:'Fixture City',region:'Fixture Region',postal:'1000',country:'Fixture Country',representativeName:'Fixture Owner',representativeTitle:'Owner',representativeEmail:'fixture@example.test',representativePhone:'123456789'}))await page.locator(`[name="${name}"]`).fill(value)
 await page.locator('[name="rewardRate"]').selectOption('20% back');await page.locator('[name="contactConsent"]').check()
}
test('application survives an uncertain response and reload with one request identity',async({page})=>{
 await offline(page);const calls:Record<string,unknown>[]=[]
 await page.route('**/api/business-applications',route=>{calls.push(route.request().postDataJSON());return calls.length===1?route.fulfill({status:503,json:{ok:false,error:'Response uncertain'}}):route.fulfill({status:200,json:{ok:true,reference:'RWD-BIZ-fixture',status:'submitted'}})})
 await page.goto(base+'/business/apply/commission');await fillApplication(page);await page.getByRole('button',{name:'Submit Application',exact:true}).click();await expect(page.getByRole('button',{name:'Retry application',exact:true})).toBeVisible();await page.reload();await expect(page.locator('[name="legalName"]')).toHaveValue('Fixture Cafe');await page.getByRole('button',{name:'Retry application',exact:true}).click();await expect(page.getByRole('heading',{name:'Application received.',exact:true})).toBeVisible();expect(calls).toHaveLength(2);expect(calls[1]).toEqual(calls[0]);await expect(page.getByText('Reference number: RWD-BIZ-fixture')).toBeVisible()
})
for(const width of [320,390,768,1440])test(`public candidate is readable without overflow at ${width}px`,async({page},info)=>{
 await page.setViewportSize({width,height:1000});await offline(page)
 for(const path of ['/membership','/business/apply/commission','/join']){
  await page.goto(base+path);await expect(page.locator('h1')).toBeVisible();await page.evaluate(()=>document.fonts.ready)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
  if(path.includes('apply')){
   const heading=await page.locator('h1').evaluate(el=>getComputedStyle(el).fontFamily);expect(heading).toContain('Space Grotesk')
   const label=page.locator('label').filter({has:page.locator('[name="legalName"]')});const marker=await label.locator('b').boundingBox(),text=await label.locator('span').boundingBox();expect(Math.abs(marker!.y-text!.y)).toBeLessThan(6)
  }
  await page.screenshot({path:info.outputPath(path.replaceAll('/','-')+'.png'),fullPage:true})
 }
})
test('free signup does not authorize billing or activate additional tiers',async({page})=>{await offline(page);await page.goto(base+'/join');await expect(page.locator('[value="free"]')).toBeChecked();await expect(page.locator('[value="regular"]')).toBeDisabled();await expect(page.locator('[value="gold"]')).toBeDisabled();await expect(page.getByText(/authorize billing/)).toHaveCount(0);await page.goto(base+'/');await expect(page.getByRole('heading',{name:'Planned — not available',exact:true})).toBeVisible();await expect(page.getByText(/full Gold-level access/)).toHaveCount(0)})
