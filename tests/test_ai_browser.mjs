import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const base='http://127.0.0.1:8765/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
const errors=[];
page.on('pageerror',err=>errors.push(err.message));
const icon=fs.readFileSync(new URL('../assets/icon-192.png',import.meta.url));
const fixture=(name)=>({name,mimeType:'image/png',buffer:icon});
async function addPhoto(category){
  const before=await page.locator('[data-ai-photo]').count();
  await page.locator('input[data-cat="'+category+'"]').setInputFiles(fixture(category+'.png'));
  await page.waitForFunction(expected=>document.querySelectorAll('[data-ai-photo]').length===expected,before+1);
}
async function start(){
  await page.goto(base);
  await page.locator('[data-a="newphoto"]').click();
  await page.locator('#vision-json').waitFor();
  return page.url().split('#/p/')[1].split('/')[0];
}
async function importResult(name,count,pool){
  const result={
    status:'draft-needs-human-review',model:'gemini-3.5-flash-lite',
    findings:{
      visibleHouseFeatures:[pool?'Pool at rear':'Three masonry arches'],
      fasciaAndAttachmentObservations:['Attachment must be checked in field'],
      measurementsToVerify:['Dimensions unknown'],
      limitations:pool?[]:['Front facade only'],
      siteGeometry:{photoCount:count,houseRoofType:pool?'hip':'gable',poolPresent:pool,facadeOpenings:[]}
    }
  };
  await page.locator('#vision-json').fill(JSON.stringify(result));
  const checkboxes=page.locator('[data-ai-photo]');
  assert.equal(await checkboxes.count(),count);
  for(let i=0;i<count;i++)await checkboxes.nth(i).check();
  await page.locator('#vision-authorized').check();
  await page.locator('[data-a="vision-import"]').click();
  await page.getByText('AI ANALYSIS · PENDING HUMAN REVIEW').waitFor();
  await page.locator('.tabbar a[href$="/studio"]').click();
  await page.getByText('AI Vision · Pending human review').waitFor();
  assert.match(await page.locator('.v17-site-reference').innerText(),new RegExp(pool?'observada':'no confirmada'));
  assert.equal(Number(await page.locator('[data-v17-key="width"]').inputValue()),0,'Vision must not invent enclosure dimensions');
  await page.screenshot({path:'qa-v17-mobile-vision-'+name+'.png',fullPage:true});
}
try{
  const idA=await start();
  for(const cat of ['frente','west','east'])await addPhoto(cat);
  await importResult('arches',3,false);
  await page.locator('.topbar a[aria-label="Volver a proyectos"]').click();
  await page.locator('[data-a="newphoto"]').click();
  await page.locator('#vision-json').waitFor();
  const idB=page.url().split('#/p/')[1].split('/')[0];
  assert.notEqual(idA,idB);
  for(const cat of ['frente','west','east','south','aerea'])await addPhoto(cat);
  await importResult('pool',5,true);
  await page.goto(base+'#/p/'+idA+'/studio');
  await page.getByText('AI Vision · Pending human review').waitFor();
  assert.match(await page.locator('.v17-site-reference').innerText(),/no confirmada/);
  await page.goto(base+'#/p/'+idB+'/studio');
  await page.getByText('AI Vision · Pending human review').waitFor();
  assert.match(await page.locator('.v17-site-reference').innerText(),/observada/);
  assert.deepEqual(errors,[],'No browser exceptions');
  console.log('PASS: two independent houses, 3/5 photos, local AI findings only, Studio reference');
}finally{await browser.close();}
