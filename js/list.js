// Drag and drop: hold the handle (⠿) and drop onto another row.
// Mouse: HTML5 drag & drop. Touch/pen: pointer events (target found via elementFromPoint).
// Tasks can be moved to another story; epics and stories can only be reordered within their own group.
const COARSE = matchMedia('(pointer:coarse)').matches;
let drag = null;
const clearOver = () => document.querySelectorAll('.over').forEach(n => n.classList.remove('over'));
function touchDrag(e, d) {
  if (e.pointerType === 'mouse') return;
  e.preventDefault(); drag = d;
  const g = e.currentTarget; let tgt = null;
  try { g.setPointerCapture(e.pointerId); } catch (x) {}
  const move = ev => {
    if (ev.clientY < 70) scrollBy(0, -14); else if (ev.clientY > innerHeight - 70) scrollBy(0, 14);
    const n = document.elementFromPoint(ev.clientX, ev.clientY), z = n && n.closest('.dz');
    clearOver(); tgt = z && z._dz.ok() ? z : null; if (tgt) tgt.classList.add('over');
  };
  const end = ev => {
    g.removeEventListener('pointermove', move); g.removeEventListener('pointerup', end); g.removeEventListener('pointercancel', end);
    clearOver();
    if (tgt && ev.type === 'pointerup') tgt._dz.go(); else drag = null;
  };
  g.addEventListener('pointermove', move); g.addEventListener('pointerup', end); g.addEventListener('pointercancel', end);
}
function grip(arr, i, getBox, kind) {
  return el('span', {className: 'grip', textContent: '⠿', title: 'Drag to reorder', draggable: !COARSE, on: {
    click: e => e.stopPropagation(),
    pointerdown: e => touchDrag(e, {arr, i, kind}),
    dragstart: e => { e.stopPropagation(); drag = {arr, i, kind}; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'x'); const b = getBox(); if (b) e.dataTransfer.setDragImage(b, 10, 10); },
    dragend: () => { drag = null; clearOver(); }}});
}
function bindDz(node, dz) {
  node.classList.add('dz'); node._dz = dz;
  node.addEventListener('dragover', e => { if (dz.ok()) { e.preventDefault(); e.stopPropagation(); node.classList.add('over'); } });
  node.addEventListener('dragleave', () => node.classList.remove('over'));
  node.addEventListener('drop', e => { if (!dz.ok()) return; e.preventDefault(); e.stopPropagation(); dz.go(); });
  return node;
}
function dropZone(row, arr, i, kind) {
  return bindDz(row, {
    ok: () => drag && (drag.arr === arr || (kind === 'task' && drag.kind === 'task')),
    go: () => {
      const fa = drag.arr, from = drag.i; drag = null;
      if (fa !== arr || from !== i) { const [x] = fa.splice(from, 1); arr.splice(i, 0, x); save(); }
      render();
    }});
}
// A task dropped on a story box is appended to that story (for empty/collapsed stories)
function dropTasks(box, sb) {
  return bindDz(box, {
    ok: () => drag && drag.kind === 'task' && drag.arr !== sb.tasks,
    go: () => { const fa = drag.arr, from = drag.i; drag = null; sb.tasks.push(fa.splice(from, 1)[0]); save(); render(); }});
}

// Header row: expand/collapse, name, counter, reorder, rename, delete
const rangeOf = ts => {
  const d = ts.map(t => t.due).filter(Boolean).sort();
  return d.length ? '📅 ' + fmt(d[0]) + (d[0] !== d[d.length - 1] ? ' – ' + fmt(d[d.length - 1]) : '') : '';
};
function head(obj, arr, i, st, nameLabel, delMsg) {
  const rg = obj.tasks ? rangeOf(obj.tasks) : '';
  const hd = el('div', {className: 'hd'},
    grip(arr, i, () => hd.closest('section.ph, .sb')),
    ic(obj.open ? '▾' : '▸', obj.open ? 'Collapse' : 'Expand', () => { obj.open = !obj.open; save(); render(); }),
    el('span', {className: 'nm', textContent: obj.name, title: 'Expand / collapse', on: {click: () => { obj.open = !obj.open; save(); render(); }}}),
    rg ? el('span', {className: 'rng', textContent: rg, title: 'Due date range'}) : '',
    el('em', {textContent: st.d + '/' + st.n + ' · ' + st.pct + '%'}),
    obj.subs ? ic('🎨', 'Change epic colour', () => colorDlg(obj, 'Epic colour')) : '',
    ic('✎', 'Rename', () => rename(obj, 'name', nameLabel)),
    ic('×', 'Delete', () => withUndo(delMsg, () => arr.splice(i, 1)), 'del'));
  return dropZone(hd, arr, i);
}

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

// Task details: summary, description, due date, assignee, priority, labels, status
function taskDlg(t) { openTask(t); }

function taskRow(t, arr, i) {
  const row = el('div', {className: 't' + (t.pri ? ' p-' + t.pri : '') + (' s-' + colOf(t)) + (t.color ? ' hasc' : '') + (t.done ? ' d' : ''), style: t.color ? '--tcol:' + t.color : ''},
    grip(arr, i, () => row, 'task'),
    el('input', {type: 'checkbox', id: t.id, checked: t.done, on: {change: e => { setStatus(t, e.target.checked ? 'done' : (t.pst && CAT[t.pst] !== 'done' ? t.pst : 'todo')); save(); render(); }}}),
    el('div', {className: 'tb'},
      el('label', {htmlFor: t.id, textContent: t.t, title: 'Double-click to edit', on: {dblclick: e => { e.preventDefault(); rename(t, 't', 'Summary'); }}}),
      t.note ? el('div', {className: 'note', textContent: t.note}) : '', chipsOf(t)),
    ic('✎', 'Edit details', () => taskDlg(t)),
    ic('×', 'Delete', () => withUndo('Task deleted', () => arr.splice(i, 1)), 'del'));
  return dropZone(row, arr, i, 'task');
}

let view = 'home', mode = 'list', ptab = 'items', showArch = false;
const flt = {pri: '', tag: '', who: '', st: ''};
const pass = t => (!flt.pri || t.pri === flt.pri) && (!flt.tag || (t.tags || []).includes(flt.tag)) && (!flt.who || t.who === flt.who) && (!flt.st || colOf(t) === flt.st);
const collapse = p => p.phases.forEach(ph => { ph.open = false; ph.subs.forEach(sb => sb.open = false); });
const open = id => {
  db.cur = id; view = 'project'; mode = 'list'; ptab = 'items'; flt.pri = flt.tag = flt.who = flt.st = '';
  collapse(cur()); // open the project collapsed
  save(); render();
};
const home = () => { view = 'home'; render(); };
const projStat = p => stat(p.phases.flatMap(tasksOf));
const delProject = p => {
  withUndo('Project deleted', () => {
    db.projects = db.projects.filter(x => x !== p);
    if (!db.projects.length) db.projects.push(Object.assign(fromTemplate(TEMPLATES[0]), {localOnly: true}));
    db.cur = db.projects[0].id; view = 'home';
  });
  if (p.cloudId) setTimeout(sweepDeleted, 9000);
};
const toggleArchive = p => withUndo(p.archived ? 'Project restored' : 'Project archived', () => { p.archived = !p.archived; if (view === 'project') view = 'home'; });

