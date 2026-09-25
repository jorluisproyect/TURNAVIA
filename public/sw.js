const CACHE='tucita-shell-v4';
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


self.addEventListener('push',event=>{
  let data={title:'TUCITA',body:'Tienes una nueva notificación.',url:'/master'};
  try{data={...data,...event.data?.json()}}catch{}
  event.waitUntil(self.registration.showNotification(data.title||'TUCITA',{
    body:data.body||'',
    icon:'/icons/icon-192.png',
    badge:'/icons/icon-192.png',
    tag:'tucita-master-alert',
    renotify:true,
    data:{url:data.url||'/master'}
  }));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=event.notification?.data?.url||'/master';
  event.waitUntil(
    clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
      for(const client of list){
        if('focus' in client){
          try{client.navigate(target)}catch{}
          return client.focus();
        }
      }
      return clients.openWindow(target);
    })
  );
});
