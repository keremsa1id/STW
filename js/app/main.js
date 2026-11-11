/* js/app/main.js: Start-up (runs last) */

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
applyTheme();
render();
notifyUrgent();
setInterval(notifyUrgent, 60 * 1000);
addEventListener('focus', notifyUrgent);
cloudBoot();
