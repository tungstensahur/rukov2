self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let data = { title: 'Ruko', body: '', url: '/' };
  try { data = e.data.json(); } catch (err) {}
  e.waitUntil(self.registration.showNotification(data.title || 'Ruko', {
    body: data.body || '',
    icon: undefined,
    tag: 'ruko-' + (data.url || ''),
    data: { url: data.url || '/' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) { c.navigate('/' + '#' + url.replace(/^#?\//, '')); return c.focus(); } }
    return clients.openWindow('/#' + url.replace(/^#?\//, ''));
  }));
});
