/* js/shared/components.js: Small reusable UI pieces: icons, chips, avatars, form field */

const ICONS = {
  list: '<path d="M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01"/>',
  kan: '<rect x="2.5" y="2.5" width="4" height="11" rx="1"/><rect x="9.5" y="2.5" width="4" height="7" rx="1"/>',
  cal: '<rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3"/>',
  tbl: '<rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/><path d="M2.5 6.5h11M2.5 10h11M7 6.5v7"/>',
  tl: '<path d="M2.5 4h6M5 8h8M3.5 12h7"/>'};
function svgIcon(k) {
  const v = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  [['viewBox', '0 0 16 16'], ['width', '16'], ['height', '16'], ['fill', 'none'], ['stroke', 'currentColor'], ['stroke-width', '1.5'], ['stroke-linecap', 'round']].forEach(([n, x]) => v.setAttribute(n, x));
  v.innerHTML = ICONS[k]; return v;
}
const stIcon = k => el('span', {className: 'si si-' + k});
const stIconOf = t => el('span', {className: 'chip st'}, stIcon(colOf(t)), COLS[colOf(t)]);
const pbar = pri => pri ? el('span', {className: 'pb p-' + pri, title: 'Priority: ' + PRI[pri]}, el('i'), el('i'), el('i')) : '';
const ava = name => {
  const h = [...name].reduce((x, c) => (x * 31 + c.charCodeAt(0)) % 360, 11);
  return el('span', {className: 'ava', title: name, style: 'background:hsl(' + h + ' 55% 45%)', textContent: name.trim().split(/\s+/).slice(0, 2).map(w => [...w][0]).join('').toLocaleUpperCase('en')});
};
const avatar = p => el('span', {className: 'av', style: '--pc:var(--c' + (db.projects.indexOf(p) % 5 + 1) + ')', textContent: ([...p.name.trim()][0] || '?').toLocaleUpperCase('en')});
const prefix = p => ([...p.name].filter(c => /\p{L}/u.test(c)).slice(0, 3).join('') || 'PRJ').toLocaleUpperCase('en');
const tagStyle = g => { const h = [...g].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7); return 'background:hsl(' + h + ' 70% 50% / .2);border-color:hsl(' + h + ' 70% 50% / .55)'; };
function chipsOf(t) {
  const c = [];
  if (t.pri) c.push(el('span', {className: 'chip p-' + t.pri, textContent: PRI[t.pri]}));
  if (t.due) c.push(el('span', {className: 'chip' + (isLate(t) ? ' late' : ''), textContent: '📅 ' + fmt(t.due) + (isLate(t) ? ' · Overdue' : '')}));
  if (t.who) c.push(el('span', {className: 'chip', textContent: '👤 ' + t.who}));
  if ((t.subs || []).length) c.push(el('span', {className: 'chip', title: 'Sub-tasks', textContent: '☑ ' + t.subs.filter(s => s.done).length + '/' + t.subs.length}));
  if (t.est || t.spent) c.push(el('span', {className: 'chip', title: 'Time spent / estimate', textContent: '⏱ ' + hrs(t.spent) + (t.est ? ' / ' + hrs(t.est) : '')}));
  (t.tags || []).forEach(g => c.push(el('span', {className: 'chip', style: tagStyle(g), textContent: '#' + g})));
  return c.length ? el('div', {className: 'chips'}, c) : '';
}
const fld = (label, node) => el('label', {className: 'fld'}, el('span', {textContent: label}), node);
const assigneeList = () => el('datalist', {id: 'assignees'}, ...[...new Set(db.projects.flatMap(pp => allTasks(pp).map(x => x.t.who)).filter(Boolean))].map(n => el('option', {value: n})));
