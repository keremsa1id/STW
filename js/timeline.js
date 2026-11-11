/* ---------- Timeline & Roadmap ---------- */
let tlZoom = 'weeks';
const TLW = {days: 32, weeks: 14, months: 5};
const zoomBar = () => el('div', {className: 'tabs'}, ...[['days', 'Days'], ['weeks', 'Weeks'], ['months', 'Months']]
  .map(([k, l]) => el('button', {className: tlZoom === k ? 'pri' : '', textContent: l, on: {click: () => { tlZoom = k; render(); }}})));

function renderTimeline(p, level) {
  const app = $('#app'), DW = TLW[tlZoom], rows = [], epics = level === 'epics';
  p.phases.forEach((ph, pi) => {
    const all = ph.subs.flatMap(s => s.tasks), list = epics ? all : all.filter(pass);
    const spans = list.filter(t => t.start || t.due).map(t => { let a = dn(t.start || t.due), b = dn(t.due || t.start); if (a > b) [a, b] = [b, a]; return {t, a, b}; });
    if (!spans.length) return;
    const done = list.filter(t => t.done).length;
    rows.push({type: 'epic', label: ph.name, a: Math.min(...spans.map(x => x.a)), b: Math.max(...spans.map(x => x.b)), pi, col: epicColor(ph, pi), pct: list.length ? Math.round(done * 100 / list.length) : 0});
    if (!epics) spans.forEach(x => rows.push({type: 'task', t: x.t, label: x.t.t, a: x.a, b: x.b, pi, col: x.t.color || epicColor(ph, pi)}));
  });
  app.append(el('div', {className: 'bartool'}, zoomBar(), el('span', {className: 'mut', textContent: epics ? 'Epics on a time axis. The filled part shows completion.' : 'Bars use each work item\'s start and due date.'})));
  if (!rows.length) { app.append(el('div', {className: 'empty', textContent: 'No dated work items. Set a start or due date on tasks to see them here.'})); return; }

  const t0 = dn(today());
  let lo = Math.min(...rows.map(r => r.a)) - 3, hi = Math.max(...rows.map(r => r.b)) + 3;
  if (t0 >= lo - 30 && t0 <= hi + 30) { lo = Math.min(lo, t0 - 2); hi = Math.max(hi, t0 + 2); }
  const days = hi - lo + 1;

  const months = [];
  for (let d = lo; d <= hi;) {
    const dt = fromDn(d), end = Math.min(hi, Math.round(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 1) / 864e5) - 1);
    months.push({d, n: end - d + 1}); d = end + 1;
  }
  const mh = el('div', {className: 'tl-mh'}, ...months.map(m => el('div', {className: 'tl-m', style: 'width:' + m.n * DW + 'px',
    textContent: fmtDn(m.d, m.n * DW > 100 ? {month: 'long', year: 'numeric'} : {month: 'short'})})));
  const dh = el('div', {className: 'tl-dh'}), body = el('div', {className: 'tl-body'});
  for (let d = lo; d <= hi; d++) {
    const wd = (fromDn(d).getUTCDay() + 6) % 7;
    if (DW >= 24 || (DW >= 10 && wd === 0)) dh.append(el('span', {className: 'tl-d', style: 'left:' + (d - lo) * DW + 'px;width:' + (DW >= 24 ? DW : DW * 7) + 'px', textContent: fromDn(d).getUTCDate()}));
    if (wd > 4 && DW >= 10 && days < 800) body.append(el('i', {className: 'tl-we', style: 'left:' + (d - lo) * DW + 'px;width:' + DW + 'px'}));
  }
  const left = el('div', {className: 'tl-l'}, el('div', {className: 'tl-lh', textContent: epics ? 'Epic' : 'Work item'}));
  rows.forEach(r => {
    const pc = '--pc:' + r.col, w = (r.b - r.a + 1) * DW;
    left.append(el('div', {className: 'tl-lr ' + r.type, style: pc, title: r.label},
      r.type === 'epic' ? [el('span', {className: 'dot'}), el('b', {textContent: r.label}), el('small', {className: 'mut', textContent: '  ' + r.pct + '%'})]
        : [el('span', {className: 'mut', textContent: keyOf(p, r.t) + '  '}), el('span', {textContent: r.label})]));
    body.append(el('div', {className: 'tl-row'}, el('div', {className: 'tlb ' + r.type + (r.t && r.t.done ? ' d' : ''), style: pc + ';left:' + (r.a - lo) * DW + 'px;width:' + w + 'px',
      title: r.label + '\n' + fmtDn(r.a) + (r.b !== r.a ? ' – ' + fmtDn(r.b) : '') + (r.type === 'epic' ? '\n' + r.pct + '% done' : ''),
      on: r.t ? {click: () => openTask(r.t)} : {}}, r.type === 'epic' ? el('i', {style: 'width:' + r.pct + '%'}) : '', el('span', {textContent: w > 70 ? r.label : ''}))));
  });
  if (t0 >= lo && t0 <= hi) body.append(el('i', {className: 'tl-today', title: 'Today', style: 'left:' + ((t0 - lo) * DW + DW / 2) + 'px'}));
  const right = el('div', {className: 'tl-r'}, el('div', {className: 'tl-in', style: 'width:' + days * DW + 'px'}, el('div', {className: 'tl-head'}, mh, dh), body));
  app.append(el('div', {className: 'tl'}, left, right));
  setTimeout(() => { right.scrollLeft = Math.max(0, (t0 - lo) * DW - 160); }, 0);
}
const renderRoadmap = p => renderTimeline(p, 'epics');

