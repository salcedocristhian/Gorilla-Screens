/* Gorilla Screens V17 — app shell cache, network-first updates. */
const CACHE='gorilla-screens-v17-ai-site-recon1';
const SHELL=['./','./index.html','./css/app.css','./css/v17.css','./js/model.js','./js/storage.js','./js/scene3d.js','./js/plan.js','./js/field-plan.js','./js/quote.js','./js/editor.js','./js/roof.js','./assets/ref-screentight-diagram.webp','./assets/ref-ezscreen-parts.webp','./assets/ref-ezscreen-doorframe.webp','./js/manufacturers.js','./docs/Screen_Enclosure_Instructions.pdf','./docs/EZ_Screen_Room_Installation.pdf','./js/v17-engine.js','./js/v17-preview.js','./js/v17-reconstruct.js','./js/v17-studio.js','./js/app.js','./assets/gorilla-logo.png','./assets/icon-192.png','./assets/icon-512.png','./assets/apple-touch-icon.png','./manifest.webmanifest'];
const LIBS=['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js','https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(async cache=>{
    await cache.addAll(SHELL); // The PWA shell is cached even if third-party CDNs are unreachable.
    await Promise.all(LIBS.map(url=>cache.add(url).catch(()=>{})));
  }));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.hostname.includes('google')||url.hostname.includes('openstreetmap.org'))return;
  if(url.origin!==self.location.origin&&!LIBS.includes(url.href))return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const c=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,c)).catch(()=>{});}
    return response;
  }).catch(()=>caches.match(event.request,{ignoreSearch:true})));
});
