/* Rams GameDay v2.1 service worker — network-first with an offline fallback.
 *
 * An earlier worker cached nothing on purpose, because the one before it had
 * been serving stale deploys. That fixed staleness but left the app blank on a
 * bad connection.
 *
 * Network-first keeps both: online, every request goes to the network and the
 * newest deploy always wins. Offline, the last good copy of the shell is
 * served so the app still opens, and the page shows its own "last known"
 * stamp from localStorage.
 *
 * Live feeds are never cached here — the app manages its own data snapshot.
 */
const CACHE='rams-gameday-shell-v2.1.0';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;

  event.respondWith((async()=>{
    try{
      const fresh=await fetch(req);
      if(fresh&&fresh.ok){
        const copy=fresh.clone();
        caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
      }
      return fresh;
    }catch(e){
      const hit=await caches.match(req);
      if(hit)return hit;
      if(req.mode==='navigate'){
        const shell=await caches.match('./index.html');
        if(shell)return shell;
      }
      throw e;
    }
  })());
});
