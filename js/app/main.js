/* js/app/main.js: Start-up (runs last) */

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.openTask) openTaskById(e.data.openTask); });
applyTheme();
render();
// Opened from a notification click while the app was closed: ?task=<id>
{ const tid = new URLSearchParams(location.search).get('task'); if (tid) { openTaskById(tid); history.replaceState(null, '', location.pathname); } }
notifyUrgent();
setInterval(notifyUrgent, 60 * 1000);
addEventListener('focus', notifyUrgent);
cloudBoot();
