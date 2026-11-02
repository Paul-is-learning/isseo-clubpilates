// Service worker du Sales Coach : alertes push (« rappel dans 10 min ») et ouverture de la fiche au clic.
// Aucune mise en cache : la page vient toujours du réseau.
self.addEventListener('install',function(){self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim());});
self.addEventListener('push',function(event){
  var payload={};
  try{payload=event.data?event.data.json():{};}catch(e){payload={title:'Sales Coach',body:event.data?event.data.text():''};}
  if(typeof payload.badge==='number'&&self.navigator&&'setAppBadge' in self.navigator){try{(payload.badge?self.navigator.setAppBadge(payload.badge):self.navigator.clearAppBadge()).catch(function(){});}catch(e){}}
  event.waitUntil(self.registration.showNotification(payload.title||'Sales Coach',{
    body:payload.body||'',icon:'./icons/icon-192.png',badge:'./icons/icon-192.png',tag:payload.tag||'cpcoach',
    data:payload.data||{},vibrate:[40,30,40],renotify:true
  }));
});
self.addEventListener('notificationclick',function(event){
  event.notification.close();
  var data=event.notification.data||{};
  var target='./'+(data.open?'?open='+encodeURIComponent(data.open):'');
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
    for(var i=0;i<list.length;i++){var c=list[i];if(c.url.indexOf(self.location.origin)>=0&&'focus'in c){c.focus();if('postMessage'in c)c.postMessage({type:'OPEN_PROSPECT',id:data.open||''});return;}}
    if(self.clients.openWindow)return self.clients.openWindow(target);
  }));
});
