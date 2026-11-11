/* js/shared/colors.js: Colour palette and colour picker */

/* ---------- Colours for epics and tasks ---------- */
const PALETTE = [['#d71920', 'Red'], ['#f97316', 'Orange'], ['#f59e0b', 'Amber'], ['#16a34a', 'Green'], ['#0ea5a4', 'Teal'], ['#2f6fed', 'Blue'], ['#6366f1', 'Indigo'], ['#8b5cf6', 'Violet'], ['#ec4899', 'Pink'], ['#667085', 'Gray']];
const isHex = c => /^#[0-9a-f]{6}$/i.test(c || '');
const epicColor = (ph, i) => isHex(ph.color) ? ph.color : 'var(--c' + (i % 5 + 1) + ')';
function swatches(cur, pick) {
  const custom = el('input', {type: 'color', className: 'swc-in', value: isHex(cur) ? cur : '#2f6fed', title: 'Custom colour'});
  custom.addEventListener('change', () => pick(custom.value));
  return el('div', {className: 'sw-grid'},
    el('button', {className: 'swc def' + (!cur ? ' on' : ''), textContent: 'Auto', title: 'Default colour', on: {click: () => pick('')}}),
    ...PALETTE.map(([c, n]) => el('button', {className: 'swc' + (cur && cur.toLowerCase() === c ? ' on' : ''), style: 'background:' + c, title: n, on: {click: () => pick(c)}})), custom);
}
const swatchRow = t => swatches(t.color, c => { t.color = c; save(); render(); });
function colorDlg(obj, title) {
  openDlg(title, el('div', {}, el('p', {className: 'mut', textContent: 'Pick a colour, or Auto to use the default.'}), swatches(obj.color, c => { obj.color = c; save(); dlg.close(); render(); })), null);
}
