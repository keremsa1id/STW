/* js/core/projects.js: Project-level actions: open, create, import, export, archive, delete */

const open = id => {
  db.cur = id; view = 'project'; mode = 'list'; ptab = 'items'; flt.pri = flt.tag = flt.who = flt.st = '';
  collapse(cur()); // open the project collapsed
  save(); render();
};
// Open a project in the Work items list with the epic and story of one task expanded, and scroll to that task
const openInList = (p, t) => {
  open(p.id);
  const x = allTasks(p).find(y => y.t === t);
  if (x) { x.ph.open = true; x.sb.open = true; save(); render(); }
  setTimeout(() => { const c = document.getElementById(t.id), r = c && c.closest('.t'); if (r) { r.scrollIntoView({block: 'center'}); r.classList.add('flash'); } }, 50);
};
const openTaskById = id => {
  for (const p of db.projects) { const x = allTasks(p).find(y => y.t.id === id); if (x) { openInList(p, x.t); return true; } }
  return false;
};
const home = () => { view = 'home'; render(); };
const projStat = p => stat(p.phases.flatMap(tasksOf));
const delProject = p => {
  withUndo('Project deleted', () => {
    db.projects = db.projects.filter(x => x !== p);
    if (!db.projects.length) db.projects.push(Object.assign(fromTemplate(TEMPLATES[0]), {localOnly: true}));
    db.cur = db.projects[0].id; view = 'home';
  });
  if (p.cloudId) setTimeout(sweepDeleted, 9000);
};
const toggleArchive = p => withUndo(p.archived ? 'Project restored' : 'Project archived', () => { p.archived = !p.archived; if (view === 'project') view = 'home'; });
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
