/* ---------- Search (Ctrl+K) ---------- */
function searchDlg() {
  const inp = el('input', {type: 'text', placeholder: 'Search work items, keys, assignees, labels…'}), box = el('div', {className: 'sr-list'});
  const all = []; db.projects.filter(p => !p.archived).forEach(p => allTasks(p).forEach(({t, ph, sb}) => all.push({t, p,
    hay: (keyOf(p, t) + ' ' + t.t + ' ' + (t.note || '') + ' ' + (t.who || '') + ' ' + t.tags.join(' ') + ' ' + p.name + ' ' + ph.name + ' ' + sb.name).toLowerCase()})));
  let items = [], idx = 0;
  const go = x => { dlg.close(); openTask(x.t); };
  const draw = () => {
    const words = inp.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    items = (words.length ? all.filter(x => words.every(w => x.hay.includes(w))) : all.slice().sort((a, b) => ((b.t.log[0] || {}).at || '').localeCompare((a.t.log[0] || {}).at || '')).slice(0, 8)).slice(0, 30);
    idx = Math.min(idx, Math.max(0, items.length - 1));
    box.replaceChildren(el('small', {className: 'mut', textContent: words.length ? items.length + ' result' + (items.length === 1 ? '' : 's') : 'Recently updated'}),
      ...items.map((x, i) => el('div', {className: 'sr-it' + (i === idx ? ' on' : ''), on: {click: () => go(x)}},
        el('span', {className: 'mut', textContent: keyOf(x.p, x.t)}), el('span', {className: 'sr-t', textContent: x.t.t}), stIconOf(x.t), el('small', {className: 'mut', textContent: x.p.name}))));
    const on = box.querySelector('.on'); if (on) on.scrollIntoView({block: 'nearest'});
  };
  inp.addEventListener('input', () => { idx = 0; draw(); });
  inp.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); idx = Math.min(idx + 1, items.length - 1); draw(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(0, idx - 1); draw(); }
    else if (e.key === 'Enter' && items[idx]) { e.preventDefault(); go(items[idx]); }
  });
  openDlg('Search', el('div', {}, inp, box), null); draw(); inp.focus();
}
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchDlg(); } });

