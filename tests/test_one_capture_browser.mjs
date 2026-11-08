import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base='http://127.0.0.1:8765/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
const errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));
const icon=fs.readFileSync(new URL('../assets/icon-192.png',import.meta.url));
const fixture=i=>({name:'site-'+i+'.png',mimeType:'image/png',buffer:icon});
const bridgeUrl='https://gorilla-studio-ai-bridge.salcedo-cristhian-2020.workers.dev/api/analyze';
let expectedPhotos=3;
page.route(bridgeUrl,async route=>{
  const req=route.request();
  const cors={'Access-Control-Allow-Origin':base.slice(0,-1),
    'Access-Control-Allow-Headers':'Authorization, Content-Type',
    'Access-Control-Allow-Methods':'POST, OPTIONS'};
  if(req.method()==='OPTIONS') return route.fulfill({status:204,headers:cors,body:''});
  const data=req.postDataBuffer().toString('latin1');
  const count=(data.match(/filename="photo-\d+\.jpg"/g)||[]).length;
  requests.push({count,authorization:req.headers().authorization||'',dataLength:data.length});
  const id=page.url().split('#/p/')[1]?.split('/')[0]||'';
  return route.fulfill({status:200,headers:{...cors,'content-type':'application/json'},
    body:JSON.stringify({projectId:id,report:{
      model:'mock-gemini',status:'draft-needs-human-review',
      findings:{visibleHouseFeatures:[count===3?'Three arches':'Pool enclosure'],
        fasciaAndAttachmentObservations:['Unverified potential attachment'],
        measurementsToVerify:['Verify dimensions onsite'],
        siteGeometry:{photoCount:count,poolPresent:count===5,houseRoofType:'gable',facadeOpenings:[]}}
    }})
  });
});
async function start(){
 await page.goto(base);
 await page.locator('[data-a="newphoto"]').click();
 await page.locator('.tabbar a[href$="/fotos"]').click();
 await page.locator('[data-ai-quick-files]').waitFor();
 return page.url().split('#/p/')[1].split('/')[0];
}
async function analyze(count,name){
 const input=page.locator('[data-ai-quick-files]');
 await input.setInputFiles(Array.from({length:count},(_,i)=>fixture(i+1)));
 await page.waitForFunction(n=>document.querySelectorAll('[data-ai-photo]:checked').length===n,count,{timeout:20000});
 assert.equal(await page.locator('#vision-json').inputValue(),'','No JSON copy/paste should be needed');
 await page.locator('#vision-token').fill('P'.repeat(48));
 await page.locator('#vision-authorized').check();
 expectedPhotos=count;
 await page.locator('[data-a="vision-analyze"]').click();
 await page.getByText('AI ANALYSIS · PENDING HUMAN REVIEW').waitFor({timeout:20000});
 assert.equal((await page.locator('[data-ai-photo]').count()),count,'No duplicate photo upload');
 assert.match(await page.locator('[aria-label="AI Vision project analysis"]').innerText(),/Evidencia vinculada al proyecto/);
 await page.locator('.tabbar a[href$="/studio"]').click();
 await page.getByText('AI Vision · Pending human review').waitFor();
 await page.screenshot({path:'qa-onecapture-'+name+'.png',fullPage:true});
}
try{
 const a=await start();
 await analyze(3,'arches');
 const b=await start();
 assert.notEqual(a,b);
 await analyze(5,'pool');
 assert.deepEqual(requests.map(x=>x.count),[3,5],'Every capture sends only its own photos');
 assert.ok(requests.every(x=>x.authorization==='Bearer '+'P'.repeat(48)));
 await page.goto(base+'#/p/'+a+'/studio');
 await page.getByText('AI Vision · Pending human review').waitFor();
 assert.match(await page.locator('.v17-site-reference').innerText(),/no confirmada/);
 await page.goto(base+'#/p/'+b+'/studio');
 await page.getByText('AI Vision · Pending human review').waitFor();
 assert.match(await page.locator('.v17-site-reference').innerText(),/observada/);
 assert.deepEqual(errors,[],'no browser JavaScript exceptions');
 console.log('PASS one-capture V17: original photos once, 3/5 images to bridge, automatic JSON storage, isolation, Studio');
}finally{await browser.close();}
