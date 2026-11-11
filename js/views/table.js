/* js/views/table.js: Table view with bulk edit */

// Table (spreadsheet) view with bulk edit
const bsel = new Set();
function renderTable(p) {
  const items = allTasks(p).filter(x => pass(x.t)), pre = prefix(p);
  for (const t of [...bsel]) if (!items.some(x => x.t === t)) bsel.delete(t);
  if (!items.length) { $('#app').append(el('div', {className: 'empty', textContent: 'No tasks.'})); return; }
  const bulk = fn => { [...bsel].forEach(fn); save(); render(); };
  const pick = (ph, opts, fn) => el('select', {on: {change: e => { if (e.target.value !== '') fn(e.target.value); }}}, el('option', {value: '', textContent: ph}), ...opts.map(([k, l]) => el('option', {value: k, textContent: l})));
  const who = el('input', {type: 'text', placeholder: 'Assignee…'}); who.setAttribute('list', 'assignees');
  const setPri = v => bulk(t => { const n = v === 'none' ? '' : v; if ((t.pri || '') !== n) { logT(t, 'Priority: ' + (PRI[t.pri] || 'None') + ' → ' + (PRI[n] || 'None')); t.pri = n; } });
  const setSprint = v => bulk(t => { const n = v === 'none' ? '' : v; if (t.sprint !== n) { logT(t, 'Sprint: ' + (sprintName(p, t.sprint) || 'None') + ' → ' + (sprintName(p, n) || 'None')); t.sprint = n; if (n && t.st === 'backlog' && !t.done) t.st = 'todo'; } });
  const bar2 = bsel.size ? el('div', {className: 'bulk'}, el('b', {textContent: bsel.size + ' selected'}),
    pick('Status…', Object.entries(COLS), v => bulk(t => setStatus(t, v))),
    pick('Priority…', [['none', 'None'], ...Object.entries(PRI)], setPri),
    ...(p.sprints.some(x => x.state !== 'closed') ? [pick('Sprint…', [['none', 'No sprint'], ...openSprints(p).map(x => [x.id, x.name])], setSprint)] : []),
    who, el('button', {textContent: 'Assign', on: {click: () => { const v = who.value.trim(); bulk(t => { if ((t.who || '') !== v) { logT(t, 'Assignee: ' + (t.who || 'None') + ' → ' + (v || 'None')); t.who = v; } }); }}}),
    el('span', {className: 'sp'}),
    el('button', {textContent: 'Delete', on: {click: () => { const set = new Set(bsel); bsel.clear(); withUndo(set.size + ' work items deleted', () => removeTasks(p, set)); }}}),
    el('button', {textContent: 'Clear', on: {click: () => { bsel.clear(); render(); }}})) : '';
  const hcb = el('input', {type: 'checkbox', checked: items.every(x => bsel.has(x.t)), title: 'Select all', on: {change: e => { items.forEach(x => e.target.checked ? bsel.add(x.t) : bsel.delete(x.t)); render(); }}});
  $('#app').append(bar2, el('div', {className: 'tblw'}, el('table', {className: 'tbl'},
    el('thead', {}, el('tr', {}, el('th', {className: 'cb'}, hcb), ...['Key', 'Summary', 'Status', 'Priority', 'Due date', 'Assignee', 'Labels', 'Location'].map(h => el('th', {textContent: h})))),
    el('tbody', {}, ...items.map(({t, ph, sb}) => el('tr', {className: (t.done ? 'd' : '') + (bsel.has(t) ? ' sel' : '') + (t.color ? ' hasc' : ''), style: t.color ? '--tcol:' + t.color : '', on: {click: () => openTask(t)}},
      el('td', {className: 'cb', on: {click: e => e.stopPropagation()}}, el('input', {type: 'checkbox', checked: bsel.has(t), on: {change: e => { e.target.checked ? bsel.add(t) : bsel.delete(t); render(); }}})),
      el('td', {className: 'mut', textContent: pre + '-' + t.num}),
      el('td', {className: 'tt', textContent: t.t}),
      el('td', {}, el('span', {className: 'chip st'}, stIcon(colOf(t)), COLS[colOf(t)])),
      el('td', {}, t.pri ? el('span', {className: 'chip p-' + t.pri, textContent: PRI[t.pri]}) : ''),
      el('td', {className: isLate(t) ? 'late' : '', textContent: t.due ? fmt(t.due) : ''}),
      el('td', {}, t.who ? [ava(t.who), ' ' + t.who] : ''),
      el('td', {}, (t.tags || []).map(g => el('span', {className: 'chip', style: tagStyle(g), textContent: '#' + g}))),
      el('td', {className: 'mut', textContent: ph.name + ' › ' + sb.name})))))), assigneeList());
}
