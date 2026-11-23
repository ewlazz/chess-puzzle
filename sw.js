/* 오프라인용: 온라인이면 항상 새로 받고(받은 건 저장), 끊기면 저장해 둔 것으로 */
const C="hansu-v45";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url),same=u.origin===location.origin,cdn=/(^|\.)cdnjs\.cloudflare\.com$|^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if(!same&&!cdn)return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(C).then(x=>x.put(e.request,c))}return r})
    .catch(()=>caches.match(e.request,{ignoreSearch:same}).then(r=>r||Response.error())));
});
