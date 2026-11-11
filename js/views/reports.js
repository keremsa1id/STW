/* js/views/reports.js: Reports and Insights */

/* ---------- Reports / insights ---------- */
function hbars(rows, max) {
  return el('div', {className: 'hb'}, ...rows.map(([label, v, cls]) => el('div', {className: 'hb-r', title: label + ': ' + v},
    el('span', {className: 'hb-l', textContent: label}), el('span', {className: 'hb-t'}, el('i', {className: cls || '', style: 'width:' + (max ? Math.max(v ? 2 : 0, v * 100 / max) : 0) + '%'})), el('b', {className: 'hb-v', textContent: v}))));
}
const wkStart = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
function insights(pairs, title) {
  const t0 = today(), wk = iso(new Date(Date.now() + 7 * 864e5)), open = pairs.filter(x => !x.t.done);
  const overdue = open.filter(x => x.t.due && x.t.due < t0).sort((a, b) => a.t.due < b.t.due ? -1 : 1);
  const dueSoon = open.filter(x => x.t.due && x.t.due >= t0 && x.t.due <= wk).length;
  const tile = (v, l, cls) => el('div', {className: 'ins-t ' + (cls || '')}, el('b', {textContent: v}), el('span', {textContent: l}));
  const card = (h, ...kids) => el('section', {className: 'ins-c'}, el('h3', {textContent: h}), ...kids);

  const cnt = {}; ST_ORDER.forEach(k => { cnt[k] = 0; }); pairs.forEach(x => { cnt[colOf(x.t)]++; });
  const total = pairs.length;
  const status = card('Status', total ? el('div', {className: 'stk'}, ...ST_ORDER.filter(k => cnt[k]).map(k => el('i', {className: 'sg-' + k, style: 'flex:' + cnt[k], title: COLS[k] + ': ' + cnt[k]}))) : el('p', {className: 'mut', textContent: 'No work items.'}),
    el('div', {className: 'lg'}, ...ST_ORDER.filter(k => cnt[k]).map(k => el('span', {}, stIcon(k), ' ' + COLS[k] + ' · ' + cnt[k] + (total ? ' (' + Math.round(cnt[k] * 100 / total) + '%)' : '')))));

  const pc = {high: 0, mid: 0, low: 0, none: 0}; open.forEach(x => { pc[x.t.pri || 'none']++; });
  const prio = card('Open by priority', hbars([['High', pc.high, 'c-high'], ['Medium', pc.mid, 'c-mid'], ['Low', pc.low, 'c-low'], ['None', pc.none, 'c-none']], Math.max(...Object.values(pc), 1)));

  const wl = {}; open.forEach(x => { const k = x.t.who || 'Unassigned'; wl[k] = (wl[k] || 0) + 1; });
  const wRows = Object.entries(wl).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const load = card('Open work by assignee', wRows.length ? hbars(wRows.map(([k, v]) => [k, v, 'c-acc']), wRows[0][1]) : el('p', {className: 'mut', textContent: 'Nothing open.'}));

  const w0 = wkStart(new Date()), weeks = [];
  for (let i = 7; i >= 0; i--) { const s = new Date(w0); s.setDate(s.getDate() - 7 * i); weeks.push({s, n: 0}); }
  pairs.forEach(x => { if (x.t.done && x.t.doneAt) { const k = wkStart(new Date(x.t.doneAt)).getTime(), w = weeks.find(y => y.s.getTime() === k); if (w) w.n++; } });
  const wmax = Math.max(...weeks.map(w => w.n), 1);
  const trend = card('Completed per week', el('div', {className: 'wk'}, ...weeks.map(w => el('div', {className: 'wk-c', title: 'Week of ' + w.s.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) + ': ' + w.n + ' completed'},
      el('b', {textContent: w.n || ''}), el('i', {style: 'height:' + (w.n ? Math.max(4, w.n * 100 / wmax) : 0) + '%'}), el('small', {className: 'mut', textContent: w.s.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})})))),
    weeks.every(w => !w.n) ? el('p', {className: 'mut', textContent: 'Completion history is recorded from now on, so this fills in as you finish work.'}) : '');

  const late = card('Overdue (' + overdue.length + ')', overdue.length ? el('div', {}, ...overdue.slice(0, 8).map(({t, p}) => el('div', {className: 'up', on: {click: () => openTask(t)}},
    el('span', {className: 'chip late', textContent: '📅 ' + fmt(t.due)}), el('span', {className: 'ut', textContent: keyOf(p, t) + ' · ' + t.t}), el('small', {className: 'mut', textContent: p.name})),
    ), overdue.length > 8 ? el('small', {className: 'mut', textContent: '+ ' + (overdue.length - 8) + ' more'}) : '') : el('p', {className: 'mut', textContent: 'Nothing overdue. 🎉'}));

  return el('div', {className: 'ins'}, el('h2', {className: 'ins-h', textContent: title || 'Insights'}),
    el('div', {className: 'ins-k'}, tile(open.length, 'open'), tile(cnt.done, 'done'), tile(overdue.length, 'overdue', overdue.length ? 'bad' : ''), tile(dueSoon, 'due in 7 days')),
    el('div', {className: 'ins-g'}, status, prio, load, trend, late));
}
function renderReports(p) {
  const app = $('#app'), act = p.sprints.find(s => s.state === 'active');
  app.append(insights(allTasks(p).map(x => ({t: x.t, p})), 'Reports'));
  if (act) app.append(el('section', {className: 'ins-c wide'}, el('h3', {textContent: 'Active sprint · ' + act.name}), burndownChart(p, act)));
}
