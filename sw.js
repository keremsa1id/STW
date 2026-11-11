// Minimal service worker: offline shell + notification support.
// Data stays in localStorage; this only caches the app files.
// The file list is read from index.html when the worker installs, so adding, renaming or removing a script or
// stylesheet there is enough: there is no second list to keep in sync. Bump CACHE only to force a clean cache.
const CACHE = 'project-tracker-v8';
const EXTRA = ['./', 'index.html', 'logo.svg?v=3', 'icon-512.png?v=3'];   // files that index.html does not name (loaded from scripts or the manifest)

async function appFiles() {
  const html = await (await fetch('index.html', {cache: 'no-cache'})).text();
  const found = [...html.matchAll(/(?:src|href)="([^":]+?\.(?:css|js|svg|png|webmanifest)(?:\?[^"]*)?)"/g)].map(m => m[1]);
  return [...new Set([...EXTRA, ...found])];
}

self.addEventListener('install', e => {
  e.waitUntil(appFiles().then(files => caches.open(CACHE).then(c => c.addAll(files))).then(() => self.skipWaiting()));
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
