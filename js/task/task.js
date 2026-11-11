/* js/task/task.js: Work item (task) page */

/* ---------- Task page ---------- */
let taskCtx = null;
function openTask(t) {
  const p = findProj(t); if (!p) return;
  taskCtx = {p, t, back: view === 'task' && taskCtx ? taskCtx.back : {view, mode, ptab}};
  db.cur = p.id; view = 'task'; save(); render(); scrollTo(0, 0);
}
function leaveTask() {
  const b = taskCtx && taskCtx.back; taskCtx = null;
  view = b ? b.view : 'project'; if (b) { mode = b.mode; ptab = b.ptab; }
}
const closeTask = () => { leaveTask(); render(); };
function deleteOpenTask() {
  const {p, t} = taskCtx, b = taskCtx.back;
  withUndo('Work item deleted', () => { removeTasks(p, new Set([t])); taskCtx = null; view = b.view; mode = b.mode; ptab = b.ptab; });
}
function renderTaskPage() {
  const t = taskCtx && taskCtx.t, p = t && findProj(t);
  if (!p) { taskCtx = null; view = 'home'; return render(); }
  const app = $('#app'), loc = allTasks(p).find(x => x.t === t);
  const sec = (title, ...kids) => el('section', {className: 'tk-sec'}, el('h3', {textContent: title}), ...kids);
  const upd = (label, oldV, newV, apply) => { if (oldV === newV) return; apply(); logT(t, label + ': ' + (oldV || 'None') + ' → ' + (newV || 'None')); save(); render(); };
  const sel = (opts, v, fn) => { const s = el('select', {on: {change: e => fn(e.target.value)}}, ...opts.map(([k, l]) => el('option', {value: k, textContent: l}))); s.value = v; return s; };
  const dateIn = (label, key) => { const x = el('input', {type: 'date', value: t[key] || ''}); x.addEventListener('change', () => upd(label, t[key] || '', x.value, () => { t[key] = x.value; })); return x; };

  // header + description
  const title = el('input', {type: 'text', className: 'tk-title', value: t.t});
  title.addEventListener('change', () => { const v = title.value.trim(); if (!v) { title.value = t.t; return; } if (v !== t.t) { logT(t, 'Summary changed'); t.t = v; save(); render(); } });
  const desc = el('textarea', {className: 'tk-desc', value: t.note || '', placeholder: 'Add a description…'});
  desc.addEventListener('change', () => { if (desc.value !== (t.note || '')) { t.note = desc.value; logT(t, 'Description updated'); save(); } });

  // sub-tasks
  const sd = t.subs.filter(s => s.done).length, subIn = el('input', {type: 'text', placeholder: 'Add a sub-task…'});
  const addSub = () => { const v = subIn.value.trim(); if (!v) return; t.subs.push({id: uid(), t: v, done: false}); logT(t, 'Sub-task added: ' + v); save(); render(); };
  subIn.addEventListener('keydown', e => { if (e.key === 'Enter') addSub(); });
  const subs = sec('Sub-tasks' + (t.subs.length ? ' · ' + sd + '/' + t.subs.length : ''),
    t.subs.length ? bar(Math.round(sd * 100 / t.subs.length)) : '',
    ...t.subs.map((s, i) => el('div', {className: 'tk-sub' + (s.done ? ' d' : '')},
      el('input', {type: 'checkbox', checked: s.done, on: {change: e => { s.done = e.target.checked; logT(t, (s.done ? 'Completed' : 'Reopened') + ' sub-task: ' + s.t); save(); render(); }}}),
      el('span', {className: 'tk-st', textContent: s.t, title: 'Double-click to edit', on: {dblclick: () => rename(s, 't', 'Sub-task')}}),
      ic('×', 'Delete', () => { t.subs.splice(i, 1); save(); render(); }, 'del'))),
    el('div', {className: 'add'}, subIn, el('button', {textContent: 'Add', on: {click: addSub}})));

  // linked work items
  const relSel = el('select', {}, ...Object.entries(REL).map(([k, l]) => el('option', {value: k, textContent: l})));
  const toSel = el('select', {}, el('option', {value: '', textContent: 'Select work item…'}),
    ...allTasks(p).filter(x => x.t !== t).map(x => el('option', {value: x.t.id, textContent: keyOf(p, x.t) + ' · ' + x.t.t.slice(0, 60)})));
  const links = sec('Linked work items', ...t.links.map(l => { const o = taskOf(p, l.to); return o ? el('div', {className: 'tk-link'},
      el('span', {className: 'mut rl', textContent: REL[l.rel]}), el('a', {href: '#', textContent: keyOf(p, o) + ' ' + o.t, on: {click: e => { e.preventDefault(); openTask(o); }}}),
      stIconOf(o), ic('×', 'Remove link', () => { removeLink(p, t, l); save(); render(); }, 'del')) : ''; }),
    el('div', {className: 'add'}, relSel, toSel, el('button', {textContent: 'Link', on: {click: () => { const o = taskOf(p, toSel.value); if (o) { addLink(p, t, relSel.value, o); save(); render(); } }}})));

  // links & attachments (URLs)
  const uIn = el('input', {type: 'text', placeholder: 'https://…'}), lIn = el('input', {type: 'text', placeholder: 'Label (optional)'}), uErr = el('small', {className: 'mut'});
  const addUrl = () => { const v = uIn.value.trim(); if (!safeUrl(v)) { uErr.textContent = 'Enter a valid http(s) link.'; return; } t.urls.push({url: v, label: lIn.value.trim()}); logT(t, 'Link added'); save(); render(); };
  const urls = sec('Links & attachments', ...t.urls.map((u, i) => el('div', {className: 'tk-link'},
      el('a', {href: u.url, target: '_blank', rel: 'noopener noreferrer', textContent: u.label || u.url}), ic('×', 'Remove', () => { t.urls.splice(i, 1); save(); render(); }, 'del'))),
    el('div', {className: 'add'}, uIn, lIn, el('button', {textContent: 'Add', on: {click: addUrl}})), uErr);

  // comments
  const cIn = el('textarea', {className: 'tk-desc', placeholder: 'Add a comment…'});
  const comments = sec('Comments · ' + t.comments.length,
    el('div', {className: 'tk-cin'}, cIn, el('button', {className: 'pri', textContent: 'Comment', on: {click: () => { const v = cIn.value.trim(); if (!v) return; t.comments.unshift({id: uid(), at: nowIso(), text: v, by: me() || 'You'}); save(); render(); }}})),
    ...t.comments.map((c, i) => el('div', {className: 'tk-cm'}, ava(c.by || 'You'),
      el('div', {className: 'tk-cb'}, el('div', {}, el('b', {textContent: c.by || 'You'}), el('small', {className: 'mut', textContent: ' · ' + fmtDT(c.at)})), el('div', {className: 'tk-ct', textContent: c.text})),
      ic('×', 'Delete', () => { t.comments.splice(i, 1); save(); render(); }, 'del'))));

  // activity
  const act = sec('Activity', ...(t.log.length ? t.log.map(l => el('div', {className: 'tk-lg'}, el('small', {className: 'mut', textContent: fmtDT(l.at)}), el('span', {textContent: l.text}))) : [el('p', {className: 'mut', textContent: 'No activity yet.'})]));

  // side panel
  const who = el('input', {type: 'text', value: t.who || '', placeholder: 'Unassigned'}); who.setAttribute('list', 'assignees');
  who.addEventListener('change', () => upd('Assignee', t.who || '', who.value.trim(), () => { t.who = who.value.trim(); }));
  const tags = el('input', {type: 'text', value: t.tags.join(', '), placeholder: 'comma separated'});
  tags.addEventListener('change', () => { const n = [...new Set(tags.value.split(',').map(x => x.trim().replace(/^#/, '')).filter(Boolean))]; upd('Labels', t.tags.join(', '), n.join(', '), () => { t.tags = n; }); });
  const numIn = (key, label) => { const x = el('input', {type: 'number', min: '0', step: '0.25', value: t[key] || ''}); x.addEventListener('change', () => { const n = Math.max(0, +x.value || 0); if (n !== t[key]) { logT(t, label + ': ' + hrs(t[key]) + ' → ' + hrs(n)); t[key] = n; save(); render(); } }); return x; };
  const quick = el('div', {className: 'tk-q'}, ...[['+15m', 0.25], ['+30m', 0.5], ['+1h', 1], ['+4h', 4]].map(([l, v]) => el('button', {textContent: l, on: {click: () => { t.spent = Math.round((t.spent + v) * 100) / 100; logT(t, 'Logged ' + l.slice(1)); save(); render(); }}})));
  const side = el('aside', {className: 'tk-side'},
    el('div', {className: 'tk-card form'},
      fld('Status', sel(Object.entries(COLS), colOf(t), v => { setStatus(t, v); save(); render(); })),
      fld('Priority', sel([['', 'None'], ...Object.entries(PRI)], t.pri || '', v => upd('Priority', PRI[t.pri] || '', PRI[v] || '', () => { t.pri = v; }))),
      fld('Assignee', who), fld('Start date', dateIn('Start date', 'start')), fld('Due date', dateIn('Due date', 'due')), fld('Labels', tags),
      fld('Colour', swatchRow(t)),
      fld('Sprint', sel([['', 'None'], ...openSprints(p, t.sprint).map(s => [s.id, s.name])], t.sprint || '', v => upd('Sprint', sprintName(p, t.sprint), sprintName(p, v), () => { t.sprint = v; if (v && t.st === 'backlog' && !t.done) t.st = 'todo'; })))),
    el('div', {className: 'tk-card form'}, el('h4', {textContent: 'Time tracking'}),
      fld('Estimate (hours)', numIn('est', 'Estimate')), fld('Time spent (hours)', numIn('spent', 'Time spent')), quick,
      t.est ? el('div', {}, bar(Math.min(100, Math.round(t.spent * 100 / t.est))), el('small', {className: 'mut', textContent: hrs(t.spent) + ' of ' + hrs(t.est) + (t.spent > t.est ? ' · over estimate' : '')})) : ''),
    el('div', {className: 'tk-card'}, el('h4', {textContent: 'Details'}),
      el('div', {className: 'tk-meta'}, el('span', {className: 'mut', textContent: 'Project'}), el('span', {textContent: p.name})),
      el('div', {className: 'tk-meta'}, el('span', {className: 'mut', textContent: 'Epic'}), el('span', {textContent: loc.ph.name})),
      el('div', {className: 'tk-meta'}, el('span', {className: 'mut', textContent: 'Story'}), el('span', {textContent: loc.sb.name}))),
    assigneeList());

  app.append(el('div', {className: 'tk'},
    el('div', {className: 'tk-main'},
      el('div', {className: 'tk-top'}, el('button', {textContent: '← Back', on: {click: closeTask}}), el('span', {className: 'chip', textContent: keyOf(p, t)}), stIconOf(t)),
      title, sec('Description', desc), subs, links, urls, comments, act), side));
}
