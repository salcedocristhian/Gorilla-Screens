import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.locator('[data-a="demo"]').click();
 await page.locator('a[href$="/studio"]').click();
 await page.locator('[data-v17-tab="trace"]').click();
 await page.locator('[data-trace-start]').click();
 const stage=page.locator('#v17-porch-infill-3d');
 await stage.locator('canvas').waitFor({timeout:20000});
 assert.equal(await stage.getAttribute('data-photo-aligned'),'false','Initial guides cannot claim to align to real house');
 const placement=page.locator('[data-trace-place]');
 await placement.click();
 const points=[
  [350,380],[295,755],[409,760],
  [520,390],[465,755],[570,760],
  [700,350],[630,752],[778,755]
 ];
 for(let i=0;i<points.length;i++){
   const svg=page.locator('.v17-trace-svg');
   await svg.scrollIntoViewIfNeeded();
   const b=await svg.boundingBox();
   assert.ok(b&&b.width>0&&b.height>0);
   await page.mouse.click(b.x+b.width*points[i][0]/1000,b.y+b.height*points[i][1]/1000);
 }
 await page.locator('.v17-trace-position strong').getByText('3 de 3 aberturas ubicadas sobre la foto').waitFor({timeout:15000});
 await stage.locator('canvas').waitFor({timeout:20000});
 assert.equal(await stage.getAttribute('data-photo-aligned'),'true');
 assert.equal(await stage.getAttribute('data-arch-count'),'3');
 assert.equal(await stage.getAttribute('data-roof-added'),'false');
 assert.equal(await stage.getAttribute('data-takeoff-eligible'),'false');
 const match=page.locator('.v17-porch-match');
 assert.equal(await match.locator('img').count(),1,'Photo match retains actual house');
 assert.equal(await match.locator('svg path').count()>=6,true,'All three traced openings have proposed screens');
 const project=await stage.getAttribute('data-project-id');
 const source=await stage.getAttribute('data-photo-id');
 assert.ok(project&&source);
 const contours=await page.locator('.v17-trace-path').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('d')));
 assert.equal(contours.length,3);
 assert.equal(contours.some((v,i)=>contours.indexOf(v)!==i),false,'Distinct arches retain separate positions');
 await match.scrollIntoViewIfNeeded();
 await page.screenshot({path:'qa-porch-photo-match-aligned-mobile.png',fullPage:true});
 await page.locator('[data-v17-tab="design"]').click();
 await page.locator('[data-v17-tab="trace"]').click();
 await stage.locator('canvas').waitFor({timeout:20000});
 assert.equal(await stage.getAttribute('data-photo-aligned'),'true','Saved contour status must persist within project');
 assert.equal(await stage.getAttribute('data-photo-id'),source);
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.locator('[data-a="newphoto"]').click();
 await page.locator('a[href$="/studio"]').click();
 await page.locator('[data-v17-tab="trace"]').click();
 await page.getByText('No hay fotografías de esta propiedad disponibles aquí.').waitFor();
 assert.equal(await page.locator('.v17-porch-match').count(),0,'Other house never sees first house photo or screen');
 assert.deepEqual(errors,[],'No JavaScript errors on mobile photo match');
 console.log('PASS Porch Photo Match: 3-point user placement, 3 arches, real photo, 3D fit safety, reload and house isolation');
}finally{await browser.close();}
