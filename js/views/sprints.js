/* js/views/sprints.js: Sprints tab and burndown chart */

/* ---------- Sprints ---------- */
let spSel = '';
function sprintDlg(p, sp) {
  const name = el('input', {type: 'text', value: sp ? sp.name : 'Sprint ' + (p.sprints.length + 1)}), start = el('input', {type: 'date', value: sp ? sp.start : today()}),
    end = el('input', {type: 'date', value: sp ? sp.end : iso(new Date(Date.now() + 13 * 864e5))}), goal = el('textarea', {value: sp ? sp.goal : '', placeholder: 'What should this sprint achieve?'});
  openDlg(sp ? 'Edit sprint' : 'Create sprint', el('div', {className: 'form'}, fld('Name', name), fld('Start date', start), fld('End date', end), fld('Goal', goal)), () => {
    if (!name.value.trim() || !start.value || !end.value || end.value < start.value) { name.focus(); return false; }
    if (sp) Object.assign(sp, {name: name.value.trim(), start: start.value, end: end.value, goal: goal.value.trim()});
    else { const n = {id: uid(), name: name.value.trim(), start: start.value, end: end.value, goal: goal.value.trim(), state: 'planned'}; p.sprints.push(n); spSel = n.id; }
    save(); render();
  });
}
function burndownChart(p, sp) {
  const a = dn(sp.start), b = dn(sp.end);
  if (!(b >= a)) return el('p', {className: 'mut', textContent: 'Invalid sprint dates.'});
  const ts = allTasks(p).map(x => x.t).filter(t => t.sprint === sp.id), total = ts.length;
  if (!total) return el('p', {className: 'mut', textContent: 'Add work items to the sprint to see the burndown.'});
  const t0 = dn(today()), last = Math.min(b, Math.max(a, t0));
  const doneDay = t => !t.done ? Infinity : t.doneAt ? Math.max(a, dn(iso(new Date(t.doneAt)))) : a;
  const actual = []; for (let d = a; d <= last; d++) actual.push([d - a, ts.filter(t => doneDay(t) > d).length]);
  return el('div', {className: 'chartbox'}, lineChart({n: b - a, max: total, xLabel: x => fmtDn(a + x),
    series: [{name: 'Ideal', pts: [[0, total], [b - a, 0]], cls: 's-ideal', unit: 'ideal'}, {name: 'Remaining', pts: actual, cls: 's-main', unit: 'remaining'}]}),
    el('div', {className: 'lg'}, el('span', {}, el('i', {className: 'sw s-main'}), ' Remaining work items'), el('span', {}, el('i', {className: 'sw s-ideal'}), ' Ideal burndown')));
}
function lineChart({n, max, series, xLabel}) {
  const W = 640, H = 220, L = 34, R = 14, T = 12, B = 26, iw = W - L - R, ih = H - T - B;
  const X = x => L + (n ? x / n : 0) * iw, Y = y => T + ih - (max ? y / max : 0) * ih;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('class', 'chart'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Burndown chart');
  let h = '';
  const ticks = Math.min(max, 4);
  for (let i = 0; i <= ticks; i++) { const v = Math.round(max * i / ticks); h += '<line class="gl" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text class="ax" x="' + (L - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + '</text>'; }
  [0, Math.round(n / 2), n].filter((v, i, a) => a.indexOf(v) === i).forEach(x => { h += '<text class="ax" x="' + X(x) + '" y="' + (H - 6) + '" text-anchor="' + (x === 0 ? 'start' : x === n ? 'end' : 'middle') + '">' + xLabel(x) + '</text>'; });
  series.forEach(s => {
    h += '<polyline class="ln ' + s.cls + '" points="' + s.pts.map(q => X(q[0]) + ',' + Y(q[1])).join(' ') + '"/>';
    const q = s.pts[s.pts.length - 1]; h += '<circle class="pt ' + s.cls + '" cx="' + X(q[0]) + '" cy="' + Y(q[1]) + '" r="4"/>';
    if (s.pts.length <= 60) s.pts.forEach(z => { h += '<circle class="hit" cx="' + X(z[0]) + '" cy="' + Y(z[1]) + '" r="8"><title>' + xLabel(z[0]) + ': ' + Math.round(z[1] * 10) / 10 + ' ' + s.unit + '</title></circle>'; });
  });
  svg.innerHTML = h; return svg;
}
function renderSprints(p) {
  const app = $('#app');
  if (!p.sprints.some(s => s.id === spSel)) spSel = (p.sprints.find(s => s.state === 'active') || p.sprints[0] || {}).id || '';
  const sp = p.sprints.find(s => s.id === spSel), TAG = {planned: 'Planned', active: 'Active', closed: 'Closed'};
  const list = el('div', {className: 'rl-list'}, el('button', {className: 'pri newb', textContent: '+ Create sprint', on: {click: () => sprintDlg(p)}}),
    ...(p.sprints.length ? p.sprints.map(s => el('button', {className: 'ri' + (s.id === spSel ? ' on' : ''), on: {click: () => { spSel = s.id; render(); }}},
      el('span', {className: 'pn'}, el('div', {textContent: s.name}), el('small', {className: 'mut', textContent: fmtDn(dn(s.start)) + ' – ' + fmtDn(dn(s.end))})), el('span', {className: 'tagdef st-' + s.state, textContent: TAG[s.state]})))
      : [el('p', {className: 'mut', textContent: 'No sprints yet.'})]));
  let main;
  if (!sp) main = el('div', {className: 'rl-main'}, el('p', {className: 'mut', textContent: 'Create a sprint to group work items into a time-boxed period and track a burndown.'}));
  else {
    const ts = allTasks(p).filter(x => x.t.sprint === sp.id), done = ts.filter(x => x.t.done).length, estH = ts.reduce((a, x) => a + (x.t.est || 0), 0);
    const cand = allTasks(p).filter(x => !x.t.done && !x.t.sprint).sort((a, b) => (colOf(a.t) === 'backlog' ? 0 : 1) - (colOf(b.t) === 'backlog' ? 0 : 1));
    const addSel = el('select', {on: {change: e => { const t = taskOf(p, e.target.value); if (t) { t.sprint = sp.id; logT(t, 'Sprint: None → ' + sp.name); if (t.st === 'backlog') setStatus(t, 'todo'); save(); render(); } }}},
      el('option', {value: '', textContent: 'Add work item…'}), ...cand.map(x => el('option', {value: x.t.id, textContent: keyOf(p, x.t) + ' · ' + x.t.t.slice(0, 60) + (colOf(x.t) === 'backlog' ? ' (backlog)' : '')})));
    const complete = () => withUndo('Sprint completed', () => { sp.state = 'closed'; ts.forEach(({t}) => { if (!t.done) { logT(t, 'Moved to backlog (sprint ' + sp.name + ' completed)'); t.sprint = ''; setStatus(t, 'backlog'); } }); });
    main = el('div', {className: 'rl-main'},
      el('div', {className: 'sp-h'}, el('h2', {textContent: sp.name}), el('span', {className: 'tagdef st-' + sp.state, textContent: TAG[sp.state]}), el('span', {className: 'sp'}),
        sp.state === 'planned' ? el('button', {className: 'pri', textContent: 'Start sprint', on: {click: () => { sp.state = 'active'; save(); render(); }}}) : '',
        sp.state === 'active' ? el('button', {className: 'pri', textContent: 'Complete sprint', on: {click: complete}}) : '',
        el('button', {textContent: 'Edit', on: {click: () => sprintDlg(p, sp)}}),
        el('button', {textContent: 'Delete', on: {click: () => withUndo('Sprint deleted', () => { p.sprints = p.sprints.filter(s => s !== sp); ts.forEach(({t}) => { t.sprint = ''; }); })}})),
      el('p', {className: 'mut', textContent: fmtDn(dn(sp.start), {day: 'numeric', month: 'short', year: 'numeric'}) + ' – ' + fmtDn(dn(sp.end), {day: 'numeric', month: 'short', year: 'numeric'}) + (sp.goal ? ' · ' + sp.goal : '')}),
      el('div', {className: 'ins-k'}, ...[[ts.length, 'work items'], [done, 'done'], [ts.length - done, 'remaining'], [estH ? hrs(estH) : '–', 'estimated']].map(([v, l]) => el('div', {className: 'ins-t'}, el('b', {textContent: v}), el('span', {textContent: l})))),
      ts.length ? bar(Math.round(done * 100 / ts.length)) : '',
      el('h4', {textContent: 'Burndown'}), burndownChart(p, sp),
      el('h4', {textContent: 'Work items'}),
      ts.length ? el('div', {className: 'bl'}, ...ts.map(({t}) => el('div', {className: 'bl-r'}, el('span', {className: 'mut bl-k', textContent: keyOf(p, t)}), el('span', {className: 'bl-t', textContent: t.t, on: {click: () => openTask(t)}}),
        stIconOf(t), pbar(t.pri), t.who ? ava(t.who) : '', ic('×', 'Remove from sprint', () => { logT(t, 'Sprint: ' + sp.name + ' → None'); t.sprint = ''; save(); render(); }, 'del')))) : el('p', {className: 'mut', textContent: 'No work items in this sprint.'}),
      sp.state !== 'closed' ? el('div', {className: 'add'}, addSel) : '');
  }
  app.append(el('div', {className: 'rl'}, list, main));
}
