import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../js/vision-api.js',import.meta.url),'utf8');
const ctx={window:{GSSVision:{normalize:(raw,projectId,ids)=>({raw,projectId,ids})}}, Blob,FormData,URL,Error,Set,Array,Promise};
vm.runInNewContext(source,ctx);
const api=ctx.window.GSSVisionAPI;
const photo=id=>({id,projectId:'house-a',blob:new Blob(['fake jpeg bytes'.repeat(40)],{type:'image/jpeg'})});
const a=[photo('a1'),photo('a2')];
assert.throws(()=>api.selectedPhotos('house-b',a),/no pertenece/);
assert.throws(()=>api.selectedPhotos('house-a',[a[0],a[0]]),/inválido/);
assert.throws(()=>api.endpoint('http://example.com/api/analyze'),/HTTPS/);
assert.throws(()=>api.endpoint('https://example.com/admin'),/HTTPS/);
let seen=0;
const result=await api.analyze({projectId:'house-a',photos:a,token:'P'.repeat(48),url:'https://example.workers.dev/api/analyze',
  fetchImpl:async(url,opts)=>{
    seen++;
    assert.equal(opts.method,'POST');
    assert.equal(opts.credentials,'omit');
    assert.equal(opts.headers.Authorization,'Bearer '+'P'.repeat(48));
    assert.equal(opts.body.getAll('photos').length,2);
    assert.equal(opts.body.get('projectId'),'house-a');
    return {ok:true,json:async()=>({projectId:'house-a',report:{findings:{siteGeometry:{photoCount:2}}}})};
  }
});
assert.equal(result.projectId,'house-a');
assert.equal(result.ids.length,2);
assert.equal(seen,1);
await assert.rejects(api.analyze({projectId:'house-a',photos:a,token:'P'.repeat(48),
  fetchImpl:async()=>({ok:true,json:async()=>({projectId:'house-b',report:{findings:{}}})})}),/otro proyecto/);
await assert.rejects(api.analyze({projectId:'house-a',photos:a,token:'short'}),/mínimo 32/);
console.log('PASS one-capture client: same project files, once-only multipart, auth and response isolation');
