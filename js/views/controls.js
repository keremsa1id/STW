/* js/views/controls.js: Project tabs, view switcher, filters and the create-task dialog */

let fOpen = false, cOpen = false;
const viewSwitch = () => el('div', {className: 'tabs'}, ...[['list', 'List'], ['kan', 'Board'], ['cal', 'Calendar'], ['tbl', 'Table'], ['tl', 'Timeline']]
  .map(([k, l]) => el('button', {className: mode === k ? 'pri' : '', title: l, on: {click: () => { mode = k; render(); }}}, svgIcon(k))));
document.addEventListener('click', e => { if ((fOpen || cOpen) && !e.target.closest('.fwrap')) { fOpen = cOpen = false; render(); } });
function filterBar(p) {
  const all = allTasks(p).map(x => x.t);
  const tags = [...new Set(all.flatMap(t => t.tags || []))].sort(), whos = [...new Set(all.map(t => t.who).filter(Boolean))].sort();
  if (!tags.includes(flt.tag)) flt.tag = '';
  if (!whos.includes(flt.who)) flt.who = '';
  const n = ['st', 'pri', 'tag', 'who'].filter(k => flt[k]).length;
  const sel = (key, label, opts) => {
    const x = el('select', {on: {change: e => { flt[key] = e.target.value; render(); }}}, el('option', {value: '', textContent: 'All'}), ...opts.map(([v, l]) => el('option', {value: v, textContent: l})));
    x.value = flt[key]; return el('label', {className: 'fld'}, el('span', {textContent: label}), x);
  };
  const pop = fOpen ? el('div', {className: 'pop'}, sel('st', 'Status', Object.entries(COLS)), sel('pri', 'Priority', Object.entries(PRI)),
    tags.length ? sel('tag', 'Labels', tags.map(x => [x, '#' + x])) : '', whos.length ? sel('who', 'Assignee', whos.map(x => [x, x])) : '',
    el('div', {className: 'sv'}, ...(db.savedFilters || []).map(sf => el('div', {className: 'sv-r'},
      el('button', {textContent: '★ ' + sf.name, on: {click: () => { Object.assign(flt, {pri: '', tag: '', who: '', st: ''}, sf.f); render(); }}}),
      ic('×', 'Delete saved filter', () => { db.savedFilters = db.savedFilters.filter(x => x !== sf); save(); render(); }, 'del'))),
      me() ? el('button', {textContent: 'Assigned to me', on: {click: () => { flt.who = me(); render(); }}}) : '',
      n ? el('button', {textContent: 'Save current filter…', on: {click: () => ask('Filter name', '', nm => { (db.savedFilters = db.savedFilters || []).push({id: uid(), name: nm, f: {pri: flt.pri, tag: flt.tag, who: flt.who, st: flt.st}}); save(); render(); })}}) : ''),
    n ? el('button', {textContent: 'Clear filters', on: {click: () => { flt.pri = flt.tag = flt.who = flt.st = ''; render(); }}}) : '') : '';
  return el('div', {className: 'fwrap'}, el('button', {className: 'fbtn' + (n ? ' on' : ''), textContent: 'Filters' + (n ? ' (' + n + ')' : '') + ' ▾',
    on: {click: e => { e.stopPropagation(); fOpen = !fOpen; render(); }}}), pop);
}
// Create a task in the selected status: asks for epic and story
function newTask(p, st) {
  const opts = p.phases.flatMap(ph => ph.subs.map(sb => [sb, ph.name + ' › ' + sb.name]));
  if (!opts.length) { openDlg('Create task', el('p', {textContent: 'First add an epic and a story from the List view.'}), null); return; }
  const title = el('input', {type: 'text', placeholder: 'What needs to be done?'}), where = el('select', {}, ...opts.map(([, l], i) => el('option', {value: i, textContent: l})));
  title.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#dlgOk').click(); } });
  const f = (l, n) => el('label', {className: 'fld'}, el('span', {textContent: l}), n);
  openDlg('Create task · ' + COLS[st], el('div', {className: 'form'}, f('Summary', title), f('Location (epic › story)', where)), () => {
    const v = title.value.trim(); if (!v) { title.focus(); return false; }
    const t = mk(v); logT(t, 'Created'); setStatus(t, st); opts[+where.value][0].tasks.push(t); save(); render();
  });
  title.focus();
}
/* ---------- Project tabs ---------- */
function projectTabs(p) {
  const T = [['items', 'Work items'], ['roadmap', 'Roadmap'], ['backlog', 'Backlog'], ['sprints', 'Sprints'], ['reports', 'Reports']];
  const nb = allTasks(p).filter(x => !x.t.done && colOf(x.t) === 'backlog').length;
  return el('div', {className: 'ptabs'}, ...T.map(([k, l]) => el('button', {className: 'pt' + (ptab === k ? ' on' : ''), on: {click: () => { ptab = k; render(); }}},
    l, k === 'backlog' && nb ? el('span', {className: 'cnt', textContent: nb}) : '')));
}
