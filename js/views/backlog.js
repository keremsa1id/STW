/* js/views/backlog.js: Backlog tab */

/* ---------- Backlog ---------- */
function renderBacklog(p) {
  const app = $('#app'), items = allTasks(p).filter(x => !x.t.done && colOf(x.t) === 'backlog');
  items.sort((a, b) => (a.t.rank || 1e9) - (b.t.rank || 1e9));
  const shift = (i, d) => { const j = i + d; if (j < 0 || j >= items.length) return; [items[i], items[j]] = [items[j], items[i]]; items.forEach((x, k) => { x.t.rank = (k + 1) * 10; }); save(); render(); };
  app.append(el('div', {className: 'bartool'}, el('b', {textContent: 'Backlog · ' + items.length + ' work items'}), el('span', {className: 'sp'}),
    el('button', {className: 'pri', textContent: '+ Create', on: {click: () => newTask(p, 'backlog')}})));
  if (!items.length) { app.append(el('div', {className: 'empty', textContent: 'The backlog is empty. Create work items here to plan them later.'})); return; }
  app.append(el('div', {className: 'bl'}, ...items.map(({t, ph}, i) => el('div', {className: 'bl-r'},
    el('span', {className: 'bl-mv'}, ic('▲', 'Move up', () => shift(i, -1), '', i === 0), ic('▼', 'Move down', () => shift(i, 1), '', i === items.length - 1)),
    el('span', {className: 'mut bl-k', textContent: keyOf(p, t)}),
    el('span', {className: 'bl-t', textContent: t.t, on: {click: () => openTask(t)}}),
    el('small', {className: 'mut bl-e', textContent: ph.name}),
    pbar(t.pri), t.est ? el('span', {className: 'chip', textContent: '⏱ ' + hrs(t.est)}) : '', t.who ? ava(t.who) : '',
    sprintSelect(p, t), el('button', {textContent: 'To Do →', title: 'Move to To Do', on: {click: () => { setStatus(t, 'todo'); save(); render(); }}})))));
}
function sprintSelect(p, t) {
  const sps = openSprints(p, t.sprint);
  if (!sps.length) return '';
  const s = el('select', {title: 'Sprint', on: {change: e => {
    const v = e.target.value; logT(t, 'Sprint: ' + (sprintName(p, t.sprint) || 'None') + ' → ' + (sprintName(p, v) || 'None'));
    t.sprint = v; if (v && t.st === 'backlog' && !t.done) setStatus(t, 'todo'); save(); render(); }}},
    el('option', {value: '', textContent: 'No sprint'}), ...sps.map(x => el('option', {value: x.id, textContent: x.name})));
  s.value = t.sprint || ''; return s;
}
