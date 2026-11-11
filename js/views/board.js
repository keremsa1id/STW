/* js/views/board.js: Board (Kanban) view */

const kcl = new Set();
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
