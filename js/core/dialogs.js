/* js/core/dialogs.js: Modal dialog helpers (openDlg, ask, soon) */

/* ---------- Dialogs ---------- */
const dlg = $('#dlg');
function openDlg(title, body, onOk) {
  $('#dlgT').textContent = title; $('#dlgB').replaceChildren(body); $('#dlgOk').textContent = 'Save';
  $('#dlgOk').style.display = onOk ? '' : 'none';
  $('#dlgOk').onclick = () => { if (onOk() !== false) dlg.close(); };
  if (!dlg.open) dlg.showModal();
}
// prompt() is blocked in some environments (previews/iframes), so an in-page dialog is used
function ask(label, def, cb) {
  const inp = el('input', {type: 'text', value: def || '', placeholder: label});
  inp.style.width = '100%';
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#dlgOk').click(); } });
  openDlg(label, inp, () => { const v = inp.value.trim(); if (!v) { inp.focus(); return false; } cb(v); });
  inp.focus(); inp.select();
}
$('#dlgX').onclick = () => dlg.close();
$('#scrim').onclick = () => document.body.classList.remove('nav');
const SOON_WHY = 'This feature is coming in an upcoming update. Everything else works already and your data stays safe.';
function soon(feature, why) {
  openDlg('Coming soon', el('div', {className: 'soon'}, el('div', {className: 'soonico', textContent: '🚧'}), el('b', {textContent: feature}), el('p', {className: 'mut', textContent: why || SOON_WHY})), null);
}
