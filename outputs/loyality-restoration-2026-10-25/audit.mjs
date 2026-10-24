import fs from 'node:fs';
import { chromium, expect } from '@playwright/test';
import ts from 'typescript';
const out='outputs/loyality-restoration-2026-10-25/';
const reference=JSON.parse(fs.readFileSync('tests/fixtures/loyality-reference-copy.json'));
const localeTree=ts.createSourceFile('copy.ts',fs.readFileSync('src/features/loyality/pages/loyality-home-copy.ts','utf8'),ts.ScriptTarget.Latest,true);
const spanish={};
function visit(n){if(ts.isPropertyAssignment(n)&&ts.isStringLiteralLike(n.initializer))spanish[n.name.text]=n.initializer.text;ts.forEachChild(n,visit)}visit(localeTree);
const browser=await chromium.launch();const p=await browser.newPage();
const result={viewports:[],checks:[],httpErrors:[],pageErrors:[]};
p.on('pageerror',e=>result.pageErrors.push(e.message));p.on('response',r=>{if(r.status()>=400)result.httpErrors.push({status:r.status(),path:new URL(r.url()).pathname})});
const base='http://127.0.0.1:5191/?tenant=loyality';
const mainCopy=['hero','example','pillars','whiteLabel','demo'].flatMap(key=>reference.sections[key]);
async function copyCheck(scope,copy){for(const text of copy)await expect(scope.getByText(text,{exact:true}).first(),text).toBeVisible()}
for(const [width,height] of [[320,780],[390,844],[768,1024],[1440,900],[844,390]]){
 await p.setViewportSize({width,height});await p.goto(base);await p.locator('h1').waitFor();await p.evaluate(()=>document.fonts.ready);
 for(const img of await p.locator('.reference-loyality img').all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);await img.evaluate(i=>i.decode())}
 await copyCheck(p.locator('main'),mainCopy);await copyCheck(p.locator('footer'),reference.sections.footer);
 await expect(p.getByRole('heading',{level:1})).toHaveText('Your loyalty card, reimagined.');
 if(width<=960){await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.locator('.reference-loyality__menu-toggle').click();await copyCheck(p.locator('#loyality-mobile-navigation'),reference.sections.navigation);await p.keyboard.press('Escape')}else await copyCheck(p.locator('.reference-loyality__nav'),reference.sections.navigation);
 const state=await p.evaluate(()=>({width:innerWidth,height:innerHeight,clientWidth:document.documentElement.clientWidth,pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,fonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>({family:f.family,weight:f.weight})),fontErrors:[...document.fonts].filter(f=>f.status==='error').map(f=>f.family),images:[...document.querySelectorAll('.reference-loyality img')].map(i=>({src:i.getAttribute('src'),width:i.naturalWidth,height:i.naturalHeight})),brokenHashes:[...document.querySelectorAll('.reference-loyality a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>!document.getElementById(h.slice(1))),targets:[...document.querySelectorAll('.reference-loyality a,.reference-loyality button,.main-site-language-dock select')].filter(e=>e.getClientRects().length&&e.getBoundingClientRect().width>0).map(e=>{const r=e.getBoundingClientRect();return{label:e.textContent.trim()||e.getAttribute('aria-label')||e.querySelector('img')?.alt||'Language',width:r.width,height:r.height}})}));
 expect(state.pageWidth).toBeLessThanOrEqual(state.clientWidth+1);expect(state.fontErrors).toEqual([]);expect(state.fonts.some(f=>f.family==='Space Grotesk'&&f.weight==='500')).toBe(true);expect(state.brokenHashes).toEqual([]);
 for(const t of state.targets){expect(t.width,t.label).toBeGreaterThanOrEqual(44);expect(t.height,t.label).toBeGreaterThanOrEqual(44)}
 await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:out+`final-${width}x${height}.png`,fullPage:true,animations:'disabled'});await p.screenshot({path:out+`hero-${width}.png`,animations:'disabled'});
 await p.locator('#pricing').scrollIntoViewIfNeeded();await p.screenshot({path:out+`benefits-${width}.png`,animations:'disabled'});
 await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
 state.footerHits=await p.evaluate(()=>{const d=document.querySelector('.main-site-language-dock').getBoundingClientRect();return[...document.querySelectorAll('footer a')].map(a=>{const r=a.getBoundingClientRect();return{label:a.textContent.trim()||a.querySelector('img')?.alt,intersectsDock:r.right>d.left&&r.left<d.right&&r.bottom>d.top&&r.top<d.bottom,hits:[r.left+8,r.left+r.width/2,r.right-8].map(x=>document.elementFromPoint(x,r.top+r.height/2)?.closest('a')===a)}})});
 for(const t of state.footerHits){expect(t.intersectsDock).toBe(false);expect(t.hits.every(Boolean)).toBe(true)}
 await expect(p.locator('.reference-loyality__nav-links a[href="#contact"]')).toHaveAttribute('aria-current','location');
 if(width<=960)await expect(p.locator('.restored-benefit-photo img')).toHaveCSS('height','320px');
 await p.screenshot({path:out+`footer-${width}.png`,animations:'disabled'});
 await p.locator('.main-site-language-dock select').selectOption('es');await expect(p.locator('html')).toHaveAttribute('lang','es');await expect(p.getByRole('heading',{level:1})).toHaveText('Tu tarjeta de fidelidad, reinventada.');await copyCheck(p.locator('main'),mainCopy.map(text=>spanish[text]));await copyCheck(p.locator('footer'),reference.sections.footer.map(text=>spanish[text]));
 if([390,1440].includes(width)){await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:out+`spanish-${width}.png`,fullPage:true,animations:'disabled'})}
 await p.locator('.main-site-language-dock select').selectOption('en');state.copyEntries=Object.values(reference.sections).flat().length;state.spanishCopy='PASS';result.viewports.push(state);
 fs.writeFileSync(out+'visual-acceptance.json',JSON.stringify(result,null,2));
}
await p.setViewportSize({width:390,height:844});await p.goto(base);
const toggle=p.locator('.reference-loyality__menu-toggle'),menu=p.locator('#loyality-mobile-navigation');
await toggle.click();await menu.locator('a').first().focus();await p.keyboard.press('Escape');await expect(menu).toBeHidden();await expect(toggle).toBeFocused();result.checks.push('Escape closes and returns keyboard focus');
await toggle.click();await p.mouse.click(5,836);await expect(menu).toBeHidden();result.checks.push('Outside pointer closes menu');
await toggle.click();await menu.getByRole('link',{name:'Product',exact:true}).click();await expect(menu).toBeHidden();await expect(p).toHaveURL(/#how$/);await expect(menu.locator('a[href="#how"]')).toHaveAttribute('aria-current','location');result.checks.push('Product anchor closes menu and marks current section');
await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await toggle.click();await p.setViewportSize({width:1440,height:900});await expect(toggle).toHaveAttribute('aria-expanded','false');result.checks.push('Desktop resize resets menu');
for(const id of ['concept','support','pillars','how','ledger','features','guarantee','example','pricing','demo','contact']){await p.evaluate(id=>{location.hash=id;document.getElementById(id).scrollIntoView({behavior:'instant'})},id);const r=await p.locator('#'+id).boundingBox();expect(r.y).toBeGreaterThanOrEqual(0);expect(r.y).toBeLessThan(900)}result.checks.push('All legacy and reference deep-link IDs resolve');
await p.goto(base);await p.getByRole('link',{name:'Request a Demo',exact:true}).click();await expect(p).toHaveURL(/\/business$/);await expect(p.getByRole('heading',{name:'A loyalty program that feels like your business.'})).toBeVisible();await p.goto('http://127.0.0.1:5191/signin?tenant=loyality');await p.getByRole('link',{name:'Create an account',exact:true}).click();await expect(p.getByLabel('Full name')).toBeVisible();result.checks.push('Demo/business, sign-in and join render through existing routes');
await p.goto(base);await p.emulateMedia({reducedMotion:'reduce'});expect(await p.locator('.reference-loyality__btn').first().evaluate(e=>getComputedStyle(e).transitionDuration)).toBe('0s');result.checks.push('Reduced-motion transitions disabled');
result.contrast=await p.evaluate(()=>{const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number),lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);return['.reference-loyality__lead','.restored-demo-tag','.restored-demo-sub','.restored-qr-row p','.restored-progress p','#pillars article p','#pricing h2','#pricing article>span','#pricing article p','footer p'].map(selector=>{const e=document.querySelector(selector),fg=getComputedStyle(e).color;let el=e,bg;while(el){const v=getComputedStyle(el).backgroundColor;if(v!=='rgba(0, 0, 0, 0)'&&v!=='transparent'){bg=v;break}el=el.parentElement}const a=lum(rgb(fg)),b=lum(rgb(bg));return{selector,foreground:fg,background:bg,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)}})});
for(const c of result.contrast)expect(c.ratio,c.selector).toBeGreaterThanOrEqual(4.5);expect(result.pageErrors).toEqual([]);expect(result.httpErrors).toEqual([]);
fs.writeFileSync(out+'visual-acceptance.json',JSON.stringify(result,null,2));await browser.close();console.log('PASS: five viewport EN/ES copy, overflow, fonts/images, 44px targets, footer hits, aliases, menu, routes, motion and sampled contrast');
