// Minimal service worker: offline shell + notification support.
// Data stays in localStorage; this only caches the app files.
const CACHE = 'project-tracker-v6';
const FILES = ['./', 'index.html', 'css/base.css?v=6', 'css/layout.css?v=6', 'css/common.css?v=6', 'css/list.css?v=6', 'css/board.css?v=6', 'css/calendar.css?v=6', 'css/responsive.css?v=6', 'css/roles.css?v=6', 'css/tasks.css?v=6', 'css/colors.css?v=6', 'css/lock.css?v=6', 'css/dialogs.css?v=6', 'css/home.css?v=6', 'js/templates.js?v=5', 'js/data.js?v=5', 'js/ui.js?v=5', 'js/list.js?v=5', 'js/roles.js?v=5', 'js/cloud.js?v=5', 'js/account.js?v=5', 'js/shell.js?v=5', 'js/notifications.js?v=5', 'js/home.js?v=5', 'js/board.js?v=5', 'js/task.js?v=5', 'js/timeline.js?v=5', 'js/sprints.js?v=5', 'js/reports.js?v=5', 'js/me.js?v=5', 'js/search.js?v=5', 'js/calendar.js?v=5', 'js/render.js?v=5', 'js/main.js?v=5', 'firebase.js?v=5', 'manifest.webmanifest?v=3', 'icon.svg?v=3', 'logo.svg?v=3', 'icon-192.png?v=3', 'icon-512.png?v=3'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Network first (so updates show up), cache as offline fallback
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: 'window'}).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});
