import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import gateway from '../experiments/freellmapi/cloudflare-worker.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const originalFetch=globalThis.fetch;
const domain='test.cloudflareaccess.com',origin='https://salcedocristhian.github.io',aud='test-audience';
const env={
 GORILLA_ALLOWED_ORIGIN:origin,CF_ACCESS_TEAM_DOMAIN:domain,CF_ACCESS_AUD:aud,ALLOWED_EMAILS:'seller@example.com',
 FREELLMAPI_URL:'https://private-router.example/v1/chat/completions',
 FREELLMAPI_MODEL:'vision-tested',FREELLMAPI_API_KEY:'server-side-test-secret',
 UPSTREAM_ACCESS_CLIENT_ID:'id',UPSTREAM_ACCESS_CLIENT_SECRET:'not-exposed'
};
const kp=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk=await crypto.subtle.exportKey('jwk',kp.publicKey);jwk.kid='test-kid';
const b64=v=>Buffer.from(v).toString('base64url');
const now=Math.floor(Date.now()/1000);
const header=b64(JSON.stringify({alg:'RS256',kid:'test-kid'}));
const payload=b64(JSON.stringify({iss:'https://'+domain,exp:now+300,iat:now,aud:[aud],email:'seller@example.com'}));
const signed=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',kp.privateKey,new TextEncoder().encode(header+'.'+payload));
const jwt=header+'.'+payload+'.'+b64(new Uint8Array(signed));
let upstreamCalls=0;
globalThis.fetch=async(input,init)=>{
 const u=String(input);
 if(u.includes('/cdn-cgi/access/certs'))return Response.json({keys:[jwk]});
 if(u==='https://private-router.example/v1/chat/completions'){
  upstreamCalls++;
  assert.equal(init.headers.authorization,'Bearer server-side-test-secret');
  assert.equal(init.headers['CF-Access-Client-Id'],'id');
  const body=JSON.parse(init.body);assert.equal(body.messages[0].content.length,2);
  return Response.json({choices:[{message:{content:JSON.stringify({
    observations:[{feature:'fascia',description:'Visible but unmeasured'}],possibleFasciaLocations:['rear of house'],
    openings:['one apparent opening'],obstacles:['tree'],measurementsToVerify:['fascia elevation'],
    limitations:['Do not infer dimensions from photos']
  })}}]});
 }
 throw Error('Unexpected URL '+u);
};
try{
 const req=(images,opts={})=>new Request('https://gorilla.example/analyze',{
  method:'POST',headers:{'origin':opts.origin||origin,'content-type':'application/json',...(opts.jwt?{'Cf-Access-Jwt-Assertion':opts.jwt}:{})},
  body:JSON.stringify({images})
 });
 const photo='data:image/jpeg;base64,'+Buffer.from('fake test bytes').toString('base64');
 assert.equal((await gateway.fetch(req([photo]),env)).status,401,'No Cloudflare Access session => no inference');
 assert.equal((await gateway.fetch(req([photo],{jwt,origin:'https://evil.example'}),env)).status,403,'CORS origin must be strictly allowlisted');
 assert.equal((await gateway.fetch(req([], {jwt}),env)).status,400,'No image request rejected');
 assert.equal((await gateway.fetch(req([photo],{jwt}),env)).status,200);
 const ok=await gateway.fetch(req([photo],{jwt}),env);
 const answer=await ok.json();
 assert.equal(answer.status,'DRAFT_REQUIRES_REVIEW');
 assert.deepEqual(answer.analysis.measurementsToVerify,['fascia elevation']);
 assert.equal(upstreamCalls,2,'Only signed and valid calls reach the vision provider');
 assert.equal(ok.headers.get('access-control-allow-origin'),origin);
 assert.ok(!JSON.stringify(answer).includes('server-side-test-secret'));
 console.log('PASS: Access JWT verified, CORS, photo validation, private upstream secret and draft-only response');
}finally{globalThis.fetch=originalFetch;}
