let fOpen = false, cOpen = false;
const kcl = new Set();
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
const viewSwitch = () => el('div', {className: 'tabs'}, ...[['list', 'List'], ['kan', 'Board'], ['cal', 'Calendar'], ['tbl', 'Table'], ['tl', 'Timeline']]
  .map(([k, l]) => el('button', {className: mode === k ? 'pri' : '', title: l, on: {click: () => { mode = k; render(); }}}, svgIcon(k))));
document.addEventListener('click', e => { if ((fOpen || cOpen) && !e.target.closest('.fwrap')) { fOpen = cOpen = false; render(); } });

const stIcon = k => el('span', {className: 'si si-' + k});
const pbar = pri => pri ? el('span', {className: 'pb p-' + pri, title: 'Priority: ' + PRI[pri]}, el('i'), el('i'), el('i')) : '';
const ava = name => {
  const h = [...name].reduce((x, c) => (x * 31 + c.charCodeAt(0)) % 360, 11);
  return el('span', {className: 'ava', title: name, style: 'background:hsl(' + h + ' 55% 45%)', textContent: name.trim().split(/\s+/).slice(0, 2).map(w => [...w][0]).join('').toLocaleUpperCase('en')});
};
const prefix = p => ([...p.name].filter(c => /\p{L}/u.test(c)).slice(0, 3).join('') || 'PRJ').toLocaleUpperCase('en');
const idxMap = p => new Map(allTasks(p).map((x, i) => [x.t, i + 1]));

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

const colsShown = () => db.cols && db.cols.length ? db.cols : DEFCOLS;
function columnsMenu(p) {
  const used = new Set(allTasks(p).map(x => colOf(x.t))), shown = new Set(colsShown());
  const pop = cOpen ? el('div', {className: 'pop'}, el('b', {textContent: 'Board columns'}),
    ...Object.keys(COLS).map(k => el('label', {className: 'pr', title: used.has(k) ? 'Has work items, so it stays visible' : ''},
      el('input', {type: 'checkbox', checked: shown.has(k) || used.has(k), disabled: used.has(k), on: {change: e => {
        const n = new Set(colsShown()); e.target.checked ? n.add(k) : n.delete(k); db.cols = Object.keys(COLS).filter(x => n.has(x)); save(); render(); }}}),
      stIcon(k), el('span', {textContent: COLS[k]})))) : '';
  return el('div', {className: 'fwrap'}, el('button', {className: 'fbtn', textContent: 'Columns ▾', on: {click: e => { e.stopPropagation(); cOpen = !cOpen; render(); }}}), pop);
}
// Drag a card to another column to change its status (mouse: whole card; touch: the ⠿ handle)
function cardDnd(t, card) {
  if (!COARSE) {
    card.draggable = true;
    card.addEventListener('dragstart', e => { drag = {kind: 'card', t}; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'x'); card.classList.add('dragging'); });
    card.addEventListener('dragend', () => { drag = null; clearOver(); card.classList.remove('dragging'); });
  }
  card.querySelector('.kk').prepend(el('span', {className: 'grip', textContent: '⠿', title: 'Drag to another column', on: {pointerdown: e => touchDrag(e, {kind: 'card', t})}}));
  return card;
}
function renderKanban(p) {
  const all = allTasks(p), items = all.filter(x => pass(x.t)), pre = prefix(p);
  const used = new Set(all.map(x => colOf(x.t))), shown = new Set(colsShown());
  const vis = Object.keys(COLS).filter(k => shown.has(k) || used.has(k));
  const wrap = el('div', {className: 'kan', style: '--n:' + vis.length});
  wrap.addEventListener('dragover', e => { const r = wrap.getBoundingClientRect(); if (e.clientX > r.right - 70) wrap.scrollLeft += 20; else if (e.clientX < r.left + 70) wrap.scrollLeft -= 20; });
  const go = (t, k) => { setStatus(t, k); save(); render(); };
  vis.forEach((k, ci) => {
    const byMove = (db.colSort || {})[k] !== 'project';
    let list = items.filter(x => colOf(x.t) === k);
    if (byMove) list = list.map((x, i) => [x, i]).sort((a, b) => (movedAt(b[0].t) > movedAt(a[0].t) ? 1 : movedAt(b[0].t) < movedAt(a[0].t) ? -1 : a[1] - b[1])).map(x => x[0]);
    const shut = kcl.has(k), col = el('div', {className: 'kcol k-' + k});
    bindDz(col, {ok: () => drag && drag.kind === 'card' && colOf(drag.t) !== k, go: () => { const t = drag.t; drag = null; setStatus(t, k); save(); render(); }});
    col.append(el('div', {className: 'kh'}, stIcon(k), el('b', {textContent: COLS[k]}), el('span', {className: 'kn', textContent: list.length}), el('span', {className: 'sp'}),
      ic(byMove ? '🕘' : '☰', byMove ? 'Sorted by latest move (click: project order)' : 'Sorted by project order (click: latest move first)', () => { (db.colSort = db.colSort || {})[k] = byMove ? 'project' : 'recent'; save(); render(); }),
      ic(shut ? '⤢' : '⤡', shut ? 'Expand' : 'Collapse', () => { shut ? kcl.delete(k) : kcl.add(k); render(); }), ic('+', 'Create', () => newTask(p, k))));
    if (!shut) {
      list.forEach(({t, ph, sb}) => col.append(cardDnd(t, el('div', {className: 'kc' + (t.color ? ' hasc' : '') + (t.done ? ' d' : ''), style: '--pc:' + epicColor(ph, p.phases.indexOf(ph)) + (t.color ? ';--tcol:' + t.color : ''), title: ph.name + ' › ' + sb.name + (t.note ? '\n\n' + t.note : '')},
        el('div', {className: 'kk'}, el('span', {className: 'kico'}), el('span', {textContent: pre + '-' + t.num}), el('span', {className: 'sp'}),
          el('span', {className: 'ka'},
            ic('◀', 'Move back', () => go(t, vis[ci - 1]), '', ci === 0),
            ic('✎', 'Edit', () => taskDlg(t)),
            ic('▶', 'Move forward', () => go(t, vis[ci + 1]), '', ci === vis.length - 1))),
        el('div', {className: 'kt', textContent: t.t, title: 'Open work item', on: {click: () => openTask(t)}}),
        el('div', {className: 'kepic', title: 'Epic: ' + ph.name + '\nStory: ' + sb.name}, el('i'), el('span', {textContent: ph.name})),
        el('div', {className: 'kp'}, pbar(t.pri), el('span', {className: 'chip st'}, stIcon(k), COLS[k]),
          t.due ? el('span', {className: 'chip' + (isLate(t) ? ' late' : ''), textContent: '📅 ' + fmt(t.due)}) : '', t.who ? ava(t.who) : ''),
        (t.tags || []).length ? el('div', {className: 'chips'}, t.tags.map(g => el('span', {className: 'chip', style: tagStyle(g), textContent: '#' + g}))) : ''))));
      col.append(el('button', {className: 'knew', textContent: '+ Create', on: {click: () => newTask(p, k)}}));
    }
    wrap.append(col);
  });
  $('#app').append(wrap);
}

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

