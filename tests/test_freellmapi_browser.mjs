// Browser QA for isolated Gorilla FreeLLMAPI experiment, with a mock local provider.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {setTimeout as sleep} from 'node:timers/promises';
import {chromium} from 'playwright';

const routerPort=39731,pilotPort=39732,base='http://127.0.0.1:'+pilotPort;
let calls=0;
const draft={
 schemaVersion:1,
 site:{houseRoofType:'flat',fasciaVisible:true,
  attachmentCandidates:[{imageIndex:3,location:'Patio-facing fascia',reason:'Edge visible in sample',confidence:'medium'}],
  obstacles:['Obstructing drain'],visibleFeatures:['Porch arches'],limitations:['No scale markers']},
 enclosure:{proposedRoof:'flat',designNotes:['Existing screened porch context'],
  doorPlacementComment:'Confirm door in field',drainageNotes:['Inspect gutters']},
 measurementsToVerify:['Measure patio opening'],warnings:['Not for engineering'],overallConfidence:'medium'
};
const mock=createServer(async(req,res)=>{
 if(req.url==='/v1/chat/completions'&&req.method==='POST'){
  let body='';for await(const c of req)body+=c;
  const request=JSON.parse(body);
  calls++;
  assert.equal(request.model,'auto');
  assert.equal(request.messages[1].content.filter(c=>c.type==='image_url').length,4);
  res.setHeader('Content-Type','application/json');
  res.end(JSON.stringify({model:'mock-vision',
   choices:[{message:{content:JSON.stringify(draft)}}],usage:{prompt_tokens:100,completion_tokens:200}}));
 }else{res.writeHead(404);res.end();}
});
mock.listen(routerPort,'127.0.0.1');await once(mock,'listening');
const child=spawn(process.execPath,['experiments/freellmapi/server.mjs'],{
 cwd:new URL('../',import.meta.url).pathname,
 env:{...process.env,GORILLA_AI_PORT:String(pilotPort),
 FREELLMAPI_BASE_URL:'http://127.0.0.1:'+routerPort+'/v1',
 FREELLMAPI_API_KEY:'ci-private-test-token',FREELLMAPI_MODEL:'auto'},
 stdio:['ignore','pipe','pipe']
});
let logs='';
child.stderr.on('data',b=>logs+=b.toString());
const browser=await chromium.launch({headless:true,
 args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,acceptDownloads:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 let ready=false;
 for(let n=0;n<55;n++){
  if(child.exitCode!==null)throw Error('Local gateway failed: '+logs);
  try{const r=await fetch(base+'/api/ai/health');if(r.ok){ready=true;break;}}catch{}
  await sleep(120);
 }
 assert.ok(ready,'Gateway not available');
 await page.goto(base+'/experiments/freellmapi/index.html',{waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:'AI Site Analysis'}).waitFor();
 await page.getByText('Local FreeLLMAPI bridge listo').waitFor();
 await page.getByRole('button',{name:'Usar muestra de Boca Raton'}).click();
 await page.locator('.photo').first().waitFor();
 assert.equal(await page.locator('.photo').count(),4,'Four existing-condition images loaded');
 assert.ok(!(await page.locator('#gallery').innerText()).includes('render-propuesto'));
 assert.equal(calls,0,'No photos transmitted without consent');
 await page.getByRole('button',{name:'Analyze with FreeLLMAPI'}).click();
 await page.getByText('Confirma la autorización para compartir fotografías.').waitFor();
 assert.equal(calls,0);
 await page.locator('#consent').check();
 await page.getByRole('button',{name:'Analyze with FreeLLMAPI'}).click();
 await page.getByText('Proposed enclosure · draft').waitFor({timeout:60000});
 assert.equal(calls,1,'One authorized call');
 await page.getByText('Suggested roof: flat').waitFor();
 const downloaded=page.waitForEvent('download');
 await page.locator('#export').click();
 assert.match((await downloaded).suggestedFilename(),/DRAFT\.json$/);
 await page.locator('#view').click();
 await page.locator('#preview canvas').waitFor({timeout:20000});
 await page.screenshot({path:'qa-freellmapi-mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+5),true,'No horizontal overflow on mobile');
 assert.deepEqual(errors,[],'No page JS exceptions');
 console.log('PASS FreeLLMAPI mock mobile UX: four real demo photos, informed consent, single vision request, JSON export and conceptual 3D');
}finally{
 await browser.close();child.kill('SIGTERM');mock.close();
}
