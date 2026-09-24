const CACHE='tucita-shell-v3';
const SHELL=['/manifest.json','/icons/icon-192.png','/icons/icon-512.png'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  // Navigation and API calls are always network-first so production never
  // remains stuck on an old cached version.
  if(event.request.mode==='navigate'||url.pathname.startsWith('/api/')){
    event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response=>{
        if(response.ok&&['script','style','image','font','manifest'].includes(event.request.destination)){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        }
        return response;
      })
      .catch(()=>caches.match(event.request))
  );
});
