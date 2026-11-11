/* js/views/list.js: List view: epics, stories and task rows */

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
// The default Work items view: epics on the left, stories and tasks of open epics on the right
function renderList(p) {
  const app = $('#app');
  if (!p.phases.length) app.append(el('div', {className: 'empty', textContent: 'No epics yet. Add one below or create a project from a template.'}));

  // Two columns: epic list on the left, stories and tasks of open epics on the right
  const side = el('div', {className: 'side'}), detail = el('div', {className: 'detail'});
  p.phases.forEach((ph, pi) => {
    const pc = '--pc:' + epicColor(ph, pi);
    side.append(el('section', {className: 'ph' + (ph.open ? ' on' : ''), style: pc}, head(ph, p.phases, pi, stat(tasksOf(ph)), 'Epic name', 'Epic deleted'), bar(stat(tasksOf(ph)).pct)));
    if (ph.open) {
      const box = el('section', {className: 'dp', style: pc}, el('h3', {textContent: ph.name}));
      ph.subs.forEach((sb, si) => {
        const inp = el('input', {type: 'text', placeholder: 'What needs to be done?'});
        const add = () => { const v = inp.value.trim(); if (v) { const nt = mk(v); logT(nt, 'Created'); sb.tasks.push(nt); save(); render(); } };
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
        const sbox = el('div', {className: 'sb'}, head(sb, ph.subs, si, stat(sb.tasks), 'Story name', 'Story deleted'), bar(stat(sb.tasks).pct));
        if (sb.open) {
          sb.tasks.forEach((t, ti) => { if (pass(t)) sbox.append(taskRow(t, sb.tasks, ti)); });
          sbox.append(el('div', {className: 'add'}, inp, el('button', {textContent: 'Create', on: {click: add}})));
        }
        box.append(dropTasks(sbox, sb));
      });
      box.append(el('div', {className: 'tools'}, el('button', {textContent: '+ Add story', on: {click: () => ask('Story name', '', n => { ph.subs.push({id: uid(), name: n, open: true, tasks: []}); save(); render(); })}})));
      detail.append(box);
    }
  });
  if (!detail.children.length && p.phases.length) detail.append(el('div', {className: 'empty', textContent: 'Select an epic on the left to see its stories and tasks.'}));

  side.append(el('button', {className: 'pri', textContent: '+ Add epic', on: {click: () => ask('Epic name', '', n => { p.phases.push({id: uid(), name: n, open: true, subs: [{id: uid(), name: 'Tasks', open: true, tasks: []}]}); save(); render(); })}}));
  app.append(el('div', {className: 'split'}, side, detail));
}
