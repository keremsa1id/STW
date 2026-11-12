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
  list.append(el('button', {className: 'tpl', on: {click: () => importProject()}}, el('b', {textContent: 'Import from text'}), el('span', {textContent: 'Write an outline in Notepad (or paste JSON) and create the project from it'})));
  openDlg('Choose a template', list, null);
}
function exportProject() { const ta = el('textarea', {spellcheck: false, value: JSON.stringify(cur(), null, 2)}); openDlg('Project backup (copy and keep)', ta, () => true); }
// Plain-text outline -> project object. "Project: name", "# Epic", "## Story", "- Task | due:2026-12-31 | who:Ali | pri:high | est:4 | #tag | note:text"
const OUTLINE_SAMPLE = [
  'Project: My new project',
  '',
  '# Planning',
  '## Requirements',
  '- Interview the stakeholders | due:2026-12-01 | who:Ali | pri:high | #research',
  '- Write the scope document | est:6 | note:One page is enough',
  '',
  '# Build',
  '- Set up the repository',
  '## Frontend',
  '- Login screen | pri:mid | #ui',
  '- Dashboard | due:2027-01-15'
].join('\n');
function parseOutline(text) {
  const o = {name: '', phases: []};
  let ph = null, sb = null, n = 0;
  const newPh = name => { ph = {name, subs: []}; o.phases.push(ph); sb = null; };
  const newSb = name => { if (!ph) newPh('Epic'); sb = {name, tasks: []}; ph.subs.push(sb); };
  for (const raw of text.split(/\r?\n/)) {
    const ln = raw.trim();
    if (!ln) continue;
    let m;
    if ((m = ln.match(/^project\s*:\s*(.+)$/i))) o.name = m[1].trim();
    else if ((m = ln.match(/^##\s+(.+)$/))) newSb(m[1].trim());
    else if ((m = ln.match(/^#\s+(.+)$/))) newPh(m[1].trim());
    else if ((m = ln.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/))) {
      const parts = m[1].split('|').map(s => s.trim());
      const t = {t: parts.shift(), tags: []};
      if (!t.t) continue;
      for (const p of parts) {
        const kv = p.match(/^(due|who|pri|est|note)\s*:\s*(.*)$/i);
        if (kv) {
          const k = kv[1].toLowerCase(), v = kv[2].trim();
          t[k] = k === 'pri' ? ({high: 'high', h: 'high', mid: 'mid', medium: 'mid', m: 'mid', low: 'low', l: 'low'}[v.toLowerCase()] || '') : v;
        } else if (p.startsWith('#')) t.tags.push(...p.split(/\s+/).map(s => s.replace(/^#/, '')).filter(Boolean));
      }
      if (!sb) newSb('Tasks');
      sb.tasks.push(t); n++;
    }
  }
  o.count = n;
  return o;
}
function importProject() {
  const ta = el('textarea', {spellcheck: false, placeholder: 'Write or paste an outline, or paste JSON (exported earlier / provided by Claude)'});
  const info = el('div', {className: 'mut'});
  const isJson = () => /^\s*[\[{]/.test(ta.value);
  const upd = () => {
    if (!ta.value.trim()) { info.textContent = ''; return; }
    if (isJson()) { info.textContent = 'Detected: JSON'; return; }
    const o = parseOutline(ta.value);
    info.textContent = 'Detected: outline · ' + plural(o.phases.length, 'epic') + ', ' + plural(o.phases.reduce((a, p) => a + p.subs.length, 0), 'story').replace('storys', 'stories') + ', ' + plural(o.count, 'task');
  };
  ta.addEventListener('input', upd);
  const sample = el('button', {className: 'btn', type: 'button', textContent: 'Insert example', on: {click: () => { ta.value = OUTLINE_SAMPLE; upd(); ta.focus(); }}});
  const dl = el('button', {className: 'btn', type: 'button', textContent: 'Download template (.txt)', on: {click: () => {
    const a = el('a', {href: URL.createObjectURL(new Blob([OUTLINE_SAMPLE + '\n'], {type: 'text/plain'})), download: 'project-outline.txt'});
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }}});
  const help = el('div', {className: 'mut', style: 'margin:0 0 8px;font-size:13px;line-height:1.5'});
  help.append(
    'Outline format, one item per line: ', el('code', {textContent: 'Project: name'}), ' · ', el('code', {textContent: '# Epic'}), ' · ', el('code', {textContent: '## Story'}), ' · ',
    el('code', {textContent: '- Task | due:2026-12-31 | who:Ali | pri:high | est:4 | #tag | note:text'}), '. Everything after the task title is optional; a task right under an epic goes into a story named "Tasks". Write it in Notepad, paste it here, done.');
  const bar = el('div', {style: 'display:flex;gap:8px;flex-wrap:wrap;margin:8px 0'}, sample, dl);
  openDlg('Import project', el('div', {}, help, ta, bar, info), () => {
    if (!ta.value.trim()) { ta.focus(); return false; }
    try {
      let o;
      if (isJson()) o = JSON.parse(ta.value);
      else { o = parseOutline(ta.value); if (!o.count) { alert('No tasks found. Start task lines with "- ".'); return false; } }
      addProject(normalize(o));
    } catch (e) { alert('Could not read the text. Check the JSON or the outline format.'); return false; }
  });
  $('#dlgOk').textContent = 'Import';
};
