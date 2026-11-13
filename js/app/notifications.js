/* js/app/notifications.js: Urgent task notifications and the due-soon list */

/* ---------- Urgent task notifications ---------- */
// Urgent: not done, due today or earlier, and priority "High" or labelled #urgent / #critical (#acil / #kritik also work)
const NKEY = 'proje-takip-bildirim';
const isUrgent = t => !t.done && t.due && t.due <= today() && (t.pri === 'high' || (t.tags || []).some(g => /^(acil|kritik|urgent|critical)$/i.test(g)));
function urgent() {
  const out = [];
  db.projects.filter(p => !p.archived).forEach(p => allTasks(p).forEach(({t}) => { if (isUrgent(t)) out.push({t, p}); }));
  return out.sort((a, b) => a.t.due < b.t.due ? -1 : a.t.due > b.t.due ? 1 : 0);
}
// Android Chrome only allows notifications through a service worker; desktop falls back to new Notification()
function showNote(title, opts) {
  const fallback = () => { try { new Notification(title, opts); } catch (e) {} };
  if (!('serviceWorker' in navigator)) return fallback();
  navigator.serviceWorker.getRegistration().then(r => r ? r.showNotification(title, opts) : fallback()).catch(fallback);
}
// Hourly system notification for every unfinished urgent task (if permitted; only while the page is open)
function notifyUrgent() {
  if (cloud.access !== 'ok') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  let s = null; try { s = JSON.parse(localStorage.getItem(NKEY)); } catch (e) {}
  const hk = today() + 'T' + pad(new Date().getHours());   // one reminder per urgent task per hour
  if (!s || s.h !== hk || !Array.isArray(s.ids)) s = {h: hk, ids: []};
  urgent().filter(({t}) => !s.ids.includes(t.id)).forEach(({t, p}) => {
    s.ids.push(t.id);
    showNote((t.due < today() ? 'Overdue: ' : 'Due today: ') + t.t, {body: p.name + (t.who ? ' · ' + t.who : '') + ' · mark as done to stop reminders', tag: t.id, data: {tid: t.id}, renotify: true, icon: 'icon-192.png?v=3'});
  });
  try { localStorage.setItem(NKEY, JSON.stringify(s)); } catch (e) {}
}
function askNotify() {
  if (!('Notification' in window)) { openDlg('Notifications', el('p', {textContent: 'This browser does not support system notifications. Urgent tasks still appear in the red box at the top of the page.'}), null); return; }
  Notification.requestPermission().then(r => {
    if (r === 'granted') notifyUrgent();
    else openDlg('Notifications', el('p', {textContent: 'Permission was not granted. You can allow notifications in the site settings next to the address bar. Urgent tasks still appear in the red box at the top of the page.'}), null);
    render();
  });
}
function urgentBox() {
  const ug = urgent(); if (!ug.length) return '';
  const box = el('div', {className: 'sum urg'}, el('b', {textContent: '🔔 Urgent tasks (' + ug.length + ')', style: 'font-size:16px;color:var(--bad)'}));
  ug.slice(0, 6).forEach(({t, p}) => box.append(el('div', {className: 'up', on: {click: () => openInList(p, t)}},
    el('span', {className: 'chip late', textContent: '📅 ' + fmt(t.due) + (t.due < today() ? ' · Overdue' : ' · Due today')}),
    el('span', {className: 'ut', textContent: t.t}), el('small', {className: 'mut', textContent: p.name}))));
  if (ug.length > 6) box.append(el('small', {className: 'mut', textContent: '+ ' + (ug.length - 6) + ' more urgent tasks'}));
  return box;
}
// Due this week + overdue (from non-archived projects)
function upcoming() {
  const lim = iso(new Date(Date.now() + 7 * 864e5)), out = [];
  db.projects.filter(p => !p.archived).forEach(p => allTasks(p).forEach(({t}) => { if (!t.done && t.due && t.due <= lim) out.push({t, p}); }));
  return out.sort((a, b) => a.t.due < b.t.due ? -1 : a.t.due > b.t.due ? 1 : 0);
}
