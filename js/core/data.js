/* js/core/data.js: Data model, localStorage, statuses, normalization */

const KEY = 'proje-takip-v2', OLD = 'proje-takip-v1';
const $ = s => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
// Task: description (note), due date (due, YYYY-MM-DD), assignee (who), priority (pri: high|mid|low), labels (tags), status (st: backlog|todo|doing; done is separate)
const safeUrl = u => { try { return /^https?:$/.test(new URL(u).protocol); } catch (e) { return false; } };
const arr0 = (v, f) => Array.isArray(v) ? v.map(f) : [];
const mk = (t, done, x = {}) => ({id: typeof x.id === 'string' && x.id ? x.id : uid(), t, done: !!done || x.st === 'cancelled', color: /^#[0-9a-f]{6}$/i.test(x.color || '') ? x.color : '', note: String(x.note || ''), due: String(x.due || ''), who: String(x.who || ''),
  pri: ['high', 'mid', 'low'].includes(x.pri) ? x.pri : '', tags: Array.isArray(x.tags) ? x.tags.map(String) : [], st: ['backlog', 'defined', 'selected', 'todo', 'doing', 'review', 'blocked', 'qa', 'cancelled'].includes(x.st) ? x.st : 'backlog',
  start: String(x.start || ''), est: +x.est > 0 ? +x.est : 0, spent: +x.spent > 0 ? +x.spent : 0, num: +x.num || 0, sprint: String(x.sprint || ''), doneAt: String(x.doneAt || ''), stAt: String(x.stAt || ''), rank: +x.rank || 0,
  subs: arr0(x.subs, s => ({id: String(s.id || uid()), t: String(s.t || ''), done: !!s.done})),
  comments: arr0(x.comments, c => ({id: String(c.id || uid()), at: String(c.at || ''), text: String(c.text || ''), by: String(c.by || '')})),
  log: arr0(x.log, l => ({at: String(l.at || ''), text: String(l.text || '')})).slice(0, 200),
  links: arr0(x.links, l => ({rel: ['blocks', 'blocked_by', 'relates'].includes(l.rel) ? l.rel : 'relates', to: String(l.to || '')})),
  urls: arr0(x.urls, u => ({url: String(u.url || ''), label: String(u.label || '')})).filter(u => safeUrl(u.url))});
const normSprints = v => arr0(v, s => ({id: String(s.id || uid()), name: String(s.name || 'Sprint'), start: String(s.start || ''), end: String(s.end || ''), goal: String(s.goal || ''),
  state: ['planned', 'active', 'closed'].includes(s.state) ? s.state : 'planned'}));
function fromTemplate(tpl, name) {
  const nm = name || tpl.name;
  return {id: uid(), name: nm, key: newKey(nm), phases: tpl.data.map(([pn, subs]) => ({
    id: uid(), name: pn, open: true,
    subs: subs.map(([sn, ts]) => ({id: uid(), name: sn, open: true, tasks: ts.map(t => mk(t))}))
  }))};
}
/* ---------- Data ---------- */
// Normalizes old and new formats (epic > story > task) into a common structure
function normalize(o) {
  const ph = Array.isArray(o.phases) ? o.phases : Array.isArray(o.asamalar) ? o.asamalar : [];
  const task = t => typeof t === 'string' ? mk(t) : mk(String(t.t || t.gorev || t.name || ''), t.done || t.bitti, t);
  const pname = String(o.name || o.ad || 'Untitled project'), ok = cleanKey(o.key);
  const taken = ok && typeof db !== 'undefined' && db && db.projects && db.projects.some(x => x.key === ok);   // an imported or copied key must stay unique
  return {id: uid(), name: pname, key: ok && !taken ? ok : newKey(ok || pname), sprints: normSprints(o.sprints), seq: +o.seq || 0, phases: ph.map(p => {
    const subs = p.subs || p.altbasliklar;
    return {id: uid(), name: String(p.name || p.ad || 'Epic'), open: true, color: /^#[0-9a-f]{6}$/i.test(p.color || '') ? p.color : '',
      subs: Array.isArray(subs)
        ? subs.map(s => ({id: uid(), name: String(s.name || s.ad || 'Story'), open: true, tasks: (s.tasks || s.gorevler || []).map(task)}))
        : [{id: uid(), name: 'Tasks', open: true, tasks: (p.tasks || p.gorevler || []).map(task)}]};
  })};
}
let db = null;
try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
if (!db) {
  try { const old = JSON.parse(localStorage.getItem(OLD)); if (old && old.projects) { db = {projects: old.projects.map(normalize)}; db.cur = db.projects[0].id; } } catch (e) {}
}
if (!db || !db.projects || !db.projects.length) { const s = fromTemplate(TEMPLATES[0]); db = {cur: s.id, projects: [s]}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} if (typeof guardPerms === 'function' && guardPerms()) return; if (typeof scheduleCloud === 'function') scheduleCloud(); };
const cur = () => db.projects.find(p => p.id === db.cur) || db.projects[0];
const tasksOf = x => x.subs ? x.subs.flatMap(s => s.tasks) : x.tasks;
const stat = ts => { const n = ts.length, d = ts.filter(x => x.done).length; return {n, d, pct: n ? Math.round(d * 100 / n) : 0}; };
const move = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; save(); render(); };
const rename = (obj, key, label) => ask(label, obj[key], n => { obj[key] = n; save(); render(); });
const applyTheme = () => { if (db.theme === 'light' || db.theme === 'dark') document.documentElement.dataset.theme = db.theme; else delete document.documentElement.dataset.theme; };
const isLate = t => !t.done && t.due && t.due < today();
const PRI = {high: 'High', mid: 'Medium', low: 'Low'};
const allTasks = p => p.phases.flatMap(ph => ph.subs.flatMap(sb => sb.tasks.map(t => ({t, ph, sb}))));
// Jira-style statuses. Category decides the colour: gray = To Do, blue = In Progress, green = Done
const COLS = {backlog: 'Backlog', defined: 'Defined', selected: 'Selected for Development', todo: 'To Do', doing: 'In Progress', review: 'In Review', blocked: 'Blocked', qa: 'Ready for QA', done: 'Done', cancelled: 'Cancelled'};
const CAT = {backlog: 'todo', defined: 'todo', selected: 'todo', todo: 'todo', doing: 'prog', review: 'prog', blocked: 'prog', qa: 'prog', done: 'done', cancelled: 'done'};
const DEFCOLS = ['backlog', 'todo', 'doing', 'review', 'blocked', 'done'];
const ST_ORDER = Object.keys(COLS);
const colOf = t => t.done ? (t.st === 'cancelled' ? 'cancelled' : 'done') : COLS[t.st] && CAT[t.st] !== 'done' ? t.st : 'backlog';
// When the task last changed status (older data: taken from the activity log)
const movedAt = t => t.stAt || ((t.log || []).find(l => /^Status:/.test(l.text)) || {}).at || '';
const logT = (t, text) => { (t.log = t.log || []).unshift({at: new Date().toISOString(), text}); if (t.log.length > 200) t.log.length = 200; };
const setStatus = (t, s) => {
  const old = colOf(t), closing = CAT[s] === 'done';
  if (closing && CAT[old] !== 'done') t.pst = old;
  t.done = closing; t.st = s;
  if (old !== s) { t.stAt = new Date().toISOString(); logT(t, 'Status: ' + COLS[old] + ' → ' + COLS[s]); t.doneAt = s === 'done' ? new Date().toISOString() : ''; }
};
// Older saved data lacks the newer fields; fill defaults and give every task a stable number (key = PREFIX-number)
const ensureTask = t => { t.subs = t.subs || []; t.comments = t.comments || []; t.log = t.log || []; t.links = t.links || []; t.urls = t.urls || [];
  t.color = t.color || ''; t.start = t.start || ''; t.est = +t.est || 0; t.spent = +t.spent || 0; t.sprint = t.sprint || ''; t.doneAt = t.doneAt || ''; t.stAt = t.stAt || ''; t.rank = +t.rank || 0; return t; };
const ensureProj = p => {
  p.sprints = p.sprints || [];
  if (!p.key) p.key = newKey(p.name, p);   // projects from before keys were stored: freeze the key they show now
  const ts = allTasks(p).map(x => ensureTask(x.t));
  p.seq = Math.max(p.seq || 0, ...ts.map(t => t.num || 0));
  ts.forEach(t => { if (!t.num) t.num = ++p.seq; });
};
db.projects.forEach(ensureProj);
