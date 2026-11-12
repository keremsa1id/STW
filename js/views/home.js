/* js/views/home.js: Dashboard */

function renderHome() {
  const app = $('#app');
  const act = db.projects.filter(p => !p.archived);
  const all = act.flatMap(p => p.phases.flatMap(tasksOf)), t = stat(all);
  const done = act.filter(p => { const s = projStat(p); return s.n && s.d === s.n; }).length;
  if (!showArch) {
    app.append(el('div', {className: 'stats'},
      ...[[act.length, act.length === 1 ? 'project' : 'projects'], [done, done === 1 ? 'completed project' : 'completed projects'], [t.d + ' / ' + t.n, (t.n === 1 ? 'task' : 'tasks') + ' completed'], [t.pct + '%', 'overall progress']]
        .map(([v, l]) => el('div', {}, el('b', {textContent: v}), el('span', {textContent: l})))));
    const up = upcoming();
    if (up.length) {
      const box = el('div', {className: 'sum'}, el('b', {textContent: 'Due this week & overdue', style: 'font-size:16px;color:var(--ink)'}));
      up.slice(0, 12).forEach(({t, p}) => box.append(el('div', {className: 'up', on: {click: () => openInList(p, t)}},
        el('span', {className: 'chip' + (isLate(t) ? ' late' : ''), textContent: '📅 ' + fmt(t.due) + (isLate(t) ? ' · Overdue' : '')}),
        el('span', {className: 'ut', textContent: t.t}), el('small', {className: 'mut', textContent: p.name}))));
      if (up.length > 12) box.append(el('small', {className: 'mut', textContent: '+ ' + (up.length - 12) + ' more ' + (up.length - 12 === 1 ? 'task' : 'tasks')}));
      app.append(box);
    }
  }
  const grid = el('div', {className: 'grid'});
  db.projects.forEach((p, i) => {
    if (!!p.archived !== showArch) return;
    const s = projStat(p);
    const card = el('div', {className: 'card', on: {click: () => open(p.id)}},
      el('div', {className: 'top'},
        el('span', {className: 'ttl', textContent: p.name}),
        ...(canProjectActions(p) ? [ic('✎', 'Rename', e => { e.stopPropagation(); rename(p, 'name', 'Project name'); }),
        ic('⧉', 'Duplicate', e => { e.stopPropagation(); const c = normalize(p); c.name = p.name + ' (copy)'; db.projects.splice(i + 1, 0, c); save(); render(); }),
        ic('📦', p.archived ? 'Unarchive' : 'Archive', e => { e.stopPropagation(); toggleArchive(p); }),
        ic('×', 'Delete', e => { e.stopPropagation(); delProject(p); }, 'del')] : [])),
      el('div', {}, el('span', {className: 'pct', textContent: s.pct + '%'}), el('small', {textContent: '  ' + s.d + '/' + plural(s.n, 'task') + ' · ' + plural(p.phases.length, 'epic')})),
      bar(s.pct));
    card.prepend(grip(db.projects, i, () => card));
    card.firstChild.style.alignSelf = 'flex-start';
    grid.append(dropZone(card, db.projects, i));
  });
  if (!showArch) grid.append(el('div', {className: 'card add', textContent: '+ Create project', on: {click: newProject}}));
  else if (!grid.children.length) grid.append(el('div', {className: 'empty', textContent: 'No archived projects.'}));
  app.append(grid);
  if (!showArch) app.append(insights(act.flatMap(pp => allTasks(pp).map(x => ({t: x.t, p: pp}))), 'Insights · all projects'));
}
