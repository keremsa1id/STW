/* js/views/me.js: For you screen */

/* ---------- For you ---------- */
function renderMe() {
  const app = $('#app'), name = me();
  const inp = el('input', {type: 'text', value: name, placeholder: 'Your name, as it appears in Assignee'});
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { db.me = inp.value.trim(); save(); render(); } });
  app.append(el('div', {className: 'sum'}, el('b', {textContent: 'Your name'}), el('p', {className: 'mut', textContent: 'Work items whose Assignee matches this name are collected here from every project.'}),
    el('div', {className: 'add'}, inp, el('button', {className: 'pri', textContent: 'Save', on: {click: () => { db.me = inp.value.trim(); save(); render(); }}}))));
  if (!name) return;
  const t0 = today(), wk = iso(new Date(Date.now() + 7 * 864e5)), mine = [];
  db.projects.filter(p => !p.archived).forEach(p => allTasks(p).forEach(({t}) => { if (!t.done && isMine(t)) mine.push({t, p}); }));
  mine.sort((a, b) => (a.t.due || '9') < (b.t.due || '9') ? -1 : 1);
  const groups = [['Overdue', x => x.t.due && x.t.due < t0], ['Today', x => x.t.due === t0], ['Next 7 days', x => x.t.due > t0 && x.t.due <= wk], ['Later', x => x.t.due > wk], ['No due date', x => !x.t.due]];
  if (!mine.length) { app.append(el('div', {className: 'empty', textContent: 'Nothing assigned to "' + name + '". Enjoy the quiet.'})); return; }
  groups.forEach(([label, fn]) => {
    const g = mine.filter(fn); if (!g.length) return;
    app.append(el('section', {className: 'sum'}, el('b', {textContent: label + ' · ' + g.length, style: 'font-size:15px'}), ...g.map(({t, p}) => el('div', {className: 'up', on: {click: () => openInList(p, t)}},
      avatar(p), el('span', {className: 'mut', textContent: keyOf(p, t)}), el('span', {className: 'ut', textContent: t.t}), pbar(t.pri), stIconOf(t),
      t.due ? el('span', {className: 'chip' + (t.due < t0 ? ' late' : ''), textContent: '📅 ' + fmt(t.due)}) : ''))));
  });
}
