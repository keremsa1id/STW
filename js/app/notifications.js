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
// Snooze / mute, kept per browser (not in the project, so other people and devices are not affected).
// {taskId: {until: ms}}  snoozed until that time   |   {taskId: {off: true, due}}  muted until the due date changes or the task is done
const SKEY = 'proje-takip-sessiz';
function muteStore() {
  let s = {}; try { s = JSON.parse(localStorage.getItem(SKEY)) || {}; } catch (e) {}
  const now = Date.now(); let dirty = false;
  Object.keys(s).forEach(id => { if (!s[id] || (!s[id].off && !(s[id].until > now))) { delete s[id]; dirty = true; } });   // drop expired snoozes
  if (dirty) muteSave(s);
  return s;
}
function muteSave(s) { try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) {} }
function muteState(t) {
  const m = muteStore()[t.id]; if (!m) return null;
  if (m.off) return m.due === t.due ? m : null;   // a new due date turns reminders back on
  return m;
}
const isMuted = t => !!muteState(t);
function snooze(t, ms) { const s = muteStore(); s[t.id] = {until: ms}; muteSave(s); render(); }
function muteTask(t) { const s = muteStore(); s[t.id] = {off: true, due: t.due}; muteSave(s); render(); }
function unmuteTask(t) { const s = muteStore(); delete s[t.id]; muteSave(s); render(); }
const SNOOZES = [['1 hour', () => Date.now() + 36e5], ['Until tonight', () => { const d = new Date(); d.setHours(24, 0, 0, 0); return +d; }],
  ['Until tomorrow 09:00', () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return +d; }]];
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
  urgent().filter(({t}) => !s.ids.includes(t.id) && !isMuted(t)).forEach(({t, p}) => {
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
// Per-task controls in the urgent box: snooze menu and mute (or unmute) button
function muteCtl(t) {
  const m = muteState(t);
  const stop = e => e.stopPropagation();   // do not open the task when a control is used
  const sel = el('select', {title: 'Snooze reminders for this task', on: {change: e => { const i = e.target.selectedIndex - 1; if (i >= 0) snooze(t, SNOOZES[i][1]()); }}},
    el('option', {textContent: 'Snooze…'}), ...SNOOZES.map(([l]) => el('option', {textContent: l})));
  return el('span', {className: 'snz', on: {click: stop}},
    m ? el('small', {className: 'mut', textContent: m.off ? '🔕 Muted' : '🔕 Snoozed until ' + fmtDT(new Date(m.until).toISOString())}) : '',
    m ? el('button', {textContent: 'Unmute', on: {click: () => unmuteTask(t)}}) : [sel, el('button', {textContent: 'Mute', title: 'Stop reminders for this task until its due date changes', on: {click: () => muteTask(t)}})]);
}
function urgentBox() {
  const ug = urgent(); if (!ug.length) return '';
  const box = el('div', {className: 'sum urg'}, el('b', {textContent: '🔔 Urgent tasks (' + ug.length + ')', style: 'font-size:16px;color:var(--bad)'}));
  ug.slice(0, 6).forEach(({t, p}) => box.append(el('div', {className: 'up', on: {click: () => openInList(p, t)}},
    el('span', {className: 'chip late', textContent: '📅 ' + fmt(t.due) + (t.due < today() ? ' · Overdue' : ' · Due today')}),
    el('span', {className: 'ut', textContent: t.t}), el('small', {className: 'mut', textContent: p.name}), muteCtl(t))));
  if (ug.length > 6) box.append(el('small', {className: 'mut', textContent: '+ ' + (ug.length - 6) + ' more urgent tasks'}));
  return box;
}
// Due this week + overdue (from non-archived projects)
function upcoming() {
  const lim = iso(new Date(Date.now() + 7 * 864e5)), out = [];
  db.projects.filter(p => !p.archived).forEach(p => allTasks(p).forEach(({t}) => { if (!t.done && t.due && t.due <= lim) out.push({t, p}); }));
  return out.sort((a, b) => a.t.due < b.t.due ? -1 : a.t.due > b.t.due ? 1 : 0);
}
