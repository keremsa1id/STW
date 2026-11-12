/* js/views/calendar.js: Calendar view */

const cal = (d => ({y: d.getFullYear(), m: d.getMonth()}))(new Date());
function renderCal(p) {
  const shift = n => { cal.m += n; if (cal.m < 0) { cal.m = 11; cal.y--; } if (cal.m > 11) { cal.m = 0; cal.y++; } render(); };
  const items = allTasks(p).map(x => x.t).filter(pass), by = {};
  items.filter(t => t.due).forEach(t => (by[t.due] = by[t.due] || []).push(t));
  const g = el('div', {className: 'calg'});
  ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].forEach(w => g.append(el('div', {className: 'cwd', textContent: w})));
  const off = (new Date(cal.y, cal.m, 1).getDay() + 6) % 7, days = new Date(cal.y, cal.m + 1, 0).getDate();
  for (let i = 0; i < off; i++) g.append(el('div'));
  for (let d = 1; d <= days; d++) {
    const key = cal.y + '-' + pad(cal.m + 1) + '-' + pad(d);
    g.append(el('div', {className: 'cd' + (key === today() ? ' today' : '')}, el('span', {className: 'dn', textContent: d}),
      ...(by[key] || []).map(t => el('div', {className: 'ct' + (t.pri ? ' p-' + t.pri : '') + (t.done ? ' d' : '') + (isLate(t) ? ' late' : ''),
        title: [t.t, t.who && 'Assignee: ' + t.who, t.pri && 'Priority: ' + PRI[t.pri], 'Status: ' + COLS[colOf(t)], t.note, (t.tags || []).length && 'Labels: ' + t.tags.join(', ')].filter(Boolean).join('\n'),
        on: {click: () => taskDlg(t)}},
        el('div', {textContent: t.t}),
        t.who ? el('small', {textContent: '👤 ' + t.who}) : '',
        el('small', {textContent: COLS[colOf(t)] + ((t.tags || []).length ? ' · ' + t.tags.map(x => '#' + x).join(' ') : '')})))));
  }
  const undated = items.filter(t => !t.due && !t.done);
  $('#app').append(el('div', {className: 'calnav'},
    ic('◀', 'Previous month', () => shift(-1)),
    el('b', {textContent: new Date(cal.y, cal.m, 1).toLocaleDateString('tr-TR', {month: 'long', year: 'numeric'})}),
    el('button', {textContent: 'Today', on: {click: () => { const n = new Date(); cal.y = n.getFullYear(); cal.m = n.getMonth(); render(); }}}),
    ic('▶', 'Next month', () => shift(1))),
    el('div', {className: 'calw'}, g),
    undated.length ? el('div', {className: 'sum', style: 'margin-top:12px'}, el('b', {textContent: 'Unscheduled open tasks (' + undated.length + ')', style: 'font-size:15px;color:var(--ink)'}),
      ...undated.map(t => el('div', {className: 'up', on: {click: () => taskDlg(t)}}, el('span', {className: 'ut', textContent: t.t}), chipsOf(t)))) : '');
}
