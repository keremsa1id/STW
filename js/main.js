/* ---------- Pencere ---------- */
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
const addProject = p => { collapse(p); if (cloud.user) p.owner = cloud.user.uid; db.projects.push(p); db.cur = p.id; view = 'project'; mode = 'list'; ptab = 'items'; flt.pri = flt.tag = flt.who = flt.st = ''; save(); render(); };

function newProject() {
  const list = el('div', {});
  TEMPLATES.forEach(tp => list.append(el('button', {className: 'tpl', on: {click: () => {
    ask('Project name', tp.name, n => addProject(fromTemplate(tp, n)));
  }}}, el('b', {textContent: tp.name}), el('span', {textContent: tp.desc}))));
  list.append(el('button', {className: 'tpl', on: {click: () => {
    ask('Project name', '', n => addProject({id: uid(), name: n, phases: []}));
  }}}, el('b', {textContent: 'Blank project'}), el('span', {textContent: 'Start from scratch and build your own epics'})));
  openDlg('Choose a template', list, null);
}

function exportProject() { const ta = el('textarea', {spellcheck: false, value: JSON.stringify(cur(), null, 2)}); openDlg('Project backup (copy and keep)', ta, () => true); }
function importProject() {
  const ta = el('textarea', {spellcheck: false, placeholder: 'Paste the JSON provided by Claude or exported earlier'});
  openDlg('Import project (JSON)', ta, () => {
    try { addProject(normalize(JSON.parse(ta.value))); }
    catch (e) { alert('Could not read the JSON. Paste the text exactly as exported.'); return false; }
  });
};

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
applyTheme();
render();
notifyUrgent();
setInterval(notifyUrgent, 60 * 1000);
addEventListener('focus', notifyUrgent);
cloudBoot();
