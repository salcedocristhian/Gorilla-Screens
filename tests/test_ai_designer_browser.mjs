import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const png=fs.readFileSync(new URL('../assets/icon-192.png',import.meta.url));
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.locator('[data-a="newphoto"]').click();
 await page.locator('[data-fs-type="porch"]').click();
 await page.locator('#addr').fill('22743 SW 56th Ave, Boca Raton, FL');
 const id=page.url().split('#/p/')[1].split('/')[0];
 await page.locator('.tabbar a[href$="/fotos"]').click();
 await page.locator('input[data-guide-cat="frente"]').setInputFiles({name:'frente.png',mimeType:'image/png',buffer:png});
 await page.locator('.fs-guide-row.is-done').waitFor({timeout:15000});
 await page.goto('http://127.0.0.1:8765/#/p/'+id+'/analisis',{waitUntil:'domcontentloaded'});
 await page.locator('.fs-ai-empty').waitFor();
 await page.locator('a[href$="/disenador"]').click();
 await page.getByRole('heading',{name:'Diseñador IA'}).first().waitFor();
 assert.match(await page.locator('.ad-context').innerText(),/Sin análisis Gemini validado/);
 await page.locator('[data-ad-answer="porch"]').click();
 await page.getByText('¿Qué aberturas existentes vamos a cerrar?').waitFor();
 await page.locator('[data-ad-answer="all"]').click();
 await page.locator('[data-ad-answer="yes"]').click();
 await page.locator('[data-ad-answer="center"]').click();
 await page.locator('[data-ad-answer="bronze"]').click();
 await page.locator('[data-ad-answer="standard"]').click();
 await page.locator('[data-ad-answer="later"]').click();
 await page.locator('.ad-finished h3').waitFor();
 assert.match(await page.locator('.ad-finished').innerText(),/Dark Bronze/);
 assert.match(await page.locator('.ad-warning').innerText(),/Ninguna medida/);
 assert.equal(await page.locator('.fs-bottom a').count(),5);
 await page.screenshot({path:'qa-ai-designer-boca-mobile.png',fullPage:true});
 await page.waitForFunction(async id=>{
   const p=await GSSStore.getProject(id);
   return p?.aiDesigner?.answers?.finish==='bronze';
 },id,{timeout:10000});
 await page.waitForTimeout(500); // allow already queued IndexedDB write transactions to settle
 const stored=await page.evaluate(async(id)=>await GSSStore.getProject(id),id);
 if(!stored?.aiDesigner)console.log('DEBUG design persisted record',JSON.stringify({
   id,currentUrl:page.url(),keys:Object.keys(stored||{}),
   answersVisible:await page.locator('.ad-finished').innerText()
 }));
 assert.ok(stored?.aiDesigner,'Designer answers must persist in the same project record');
 assert.equal(stored.aiDesigner.answers.kind,'porch');
 assert.equal(stored.aiDesigner.answers.finish,'bronze');
 assert.equal(stored.studioV17?.verified||false,false);
 assert.equal((stored.openings||[]).length,0,'No fictitious customer arches');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.ad-finished h3').waitFor();
 await page.locator('[data-ad-continue]').click();
 await page.getByRole('heading',{name:'Medidas y edición'}).waitFor();
 await page.waitForFunction(async id=>{
   const p=await GSSStore.getProject(id);
   return p?.aiDesigner?.reviewed===true;
 },id,{timeout:10000});
 const saved=await page.evaluate(async(id)=>await GSSStore.getProject(id),id);
 assert.equal(saved.aiDesigner.reviewed,true);
 assert.equal(saved.studioV17?.verified||false,false,'Design review does not imply measurement verification');
 await page.locator('.topbar a[aria-label="Volver a proyectos"]').click();
 await page.locator('[data-a="newphoto"]').click();
 await page.waitForURL(/#\/p\/[^/]+\/datos/);
 const newId=page.url().split('#/p/')[1].split('/')[0];
 assert.notEqual(newId,id);
 await page.goto('http://127.0.0.1:8765/#/p/'+newId+'/disenador',{waitUntil:'domcontentloaded'});
 await page.locator('[data-ad-answer="pool"]').waitFor();
 assert.equal(await page.locator('.ad-finished').count(),0);
 const foreign=await page.evaluate(async(id)=>await GSSStore.getProject(id),newId);
 assert.equal(foreign.aiDesigner?.answers?.finish,undefined);
 assert.deepEqual(errors,[]);
 console.log('PASS Designer mobile: site-specific step, project isolation, saved answers, no fabricated measurements');
}finally{await browser.close();}
