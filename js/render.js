/* ---------- Read-only / permission lock ----------
   For people without edit rights the controls are shown but inactive. Full lock for view-only roles;
   partial lock (hide create / delete / structure controls) when only some permissions are missing. */
const RO_OK_TITLES = new Set(['Collapse', 'Expand', 'Previous month', 'Next month']);
const RO_OK_TEXT = new Set(['← Back', 'Expand all', 'Collapse all', 'Today', 'Columns ▾']);
const roOk = b => !!b.closest('.tabs,.ptabs,.fwrap,.ri') || RO_OK_TITLES.has(b.title) || RO_OK_TEXT.has(b.textContent.trim());
// Rename / duplicate / archive / delete a project: only when the role allows it (device-only projects always)
const canProjectActions = p => { if (!p.cloudId || !cloud.user) return true; const i = roleIn(p); return i.all || (canEditProject(p) && i.perms.has('p_archive')); };
function applyLock() {
  const cl = document.body.classList;
  ['ro', 'no-t_create', 'no-t_delete', 'no-e_edit', 'no-p_archive'].forEach(c => cl.remove(c));
  if (!cloud.user || cloud.access !== 'ok' || (view !== 'project' && view !== 'task')) return;
  const p = view === 'task' && taskCtx ? taskCtx.p : cur();
  if (!p || !p.cloudId) return;
  const i = roleIn(p); if (i.all) return;
  const has = k => canEditProject(p) && i.perms.has(k);
  const full = !['t_create', 't_edit_any', 't_edit_own', 'e_edit'].some(has);
  if (full) {
    cl.add('ro');
    document.querySelectorAll('#app input,#app textarea,#app select').forEach(n => { if (!n.closest('.pop')) n.disabled = true; });
    document.querySelectorAll('#app button').forEach(b => { if (!roOk(b)) b.disabled = true; });
    document.querySelectorAll('#app [draggable=true]').forEach(n => { n.draggable = false; });
  } else {
    ['t_create', 't_delete', 'e_edit'].forEach(k => { if (!has(k)) cl.add('no-' + k); });
    if (!has('t_edit_any') && !has('t_edit_own')) document.querySelectorAll('#app .t input[type=checkbox]').forEach(n => { n.disabled = true; });
  }
  if (!has('p_archive')) { cl.add('no-p_archive'); document.querySelectorAll('#top .ic[title="Rename project"]').forEach(n => { n.disabled = true; }); }
}
// double-click rename must not work on locked screens
document.addEventListener('dblclick', e => { if (document.body.classList.contains('ro') && e.target.closest('#app')) e.stopPropagation(); }, true);

// Re-rendering rebuilds the page; keep the scroll position (page and inner scrollers) when the view did not change
const SCROLLERS = ['.kan', '.side', '.tl-r', '.tblw', '.calw'];
let lastKey = '';
function render() {
  const key = view + '|' + mode + '|' + ptab + '|' + (view === 'task' && taskCtx ? taskCtx.t.id : '');
  const same = key === lastKey, sx = scrollX, sy = scrollY;
  const inner = SCROLLERS.map(q => { const n = document.querySelector(q); return n ? [q, n.scrollLeft, n.scrollTop] : null; }).filter(Boolean);
  renderInner();
  applyLock();
  lastKey = key;
  if (!same) return;
  const restore = () => { scrollTo(sx, sy); inner.forEach(([q, l, t]) => { const n = document.querySelector(q); if (n) { n.scrollLeft = l; n.scrollTop = t; } }); };
  restore(); setTimeout(restore, 0);
}
function renderInner() {
  const app = $('#app'); app.replaceChildren();
  document.body.classList.remove('nav');
  const gated = gateNeeded(); document.body.classList.toggle('gated', gated); if (gated) return renderGate();
  db.projects.forEach(ensureProj);
  renderSidebar(); renderHeader();
  app.append(urgentBox());
  app.append(roBanner());
  if (view === 'home') return renderHome();
  if (view === 'roles') return renderRoles();
  if (view === 'me') return renderMe();
  if (view === 'task') return renderTaskPage();
  const p = cur(), s = projStat(p);
  const setAll = v => { p.phases.forEach(ph => { ph.open = v; ph.subs.forEach(sb => sb.open = v); }); save(); render(); };

  app.append(projectTabs(p));
  if (ptab === 'roadmap') return renderRoadmap(p);
  if (ptab === 'backlog') return renderBacklog(p);
  if (ptab === 'sprints') return renderSprints(p);
  if (ptab === 'reports') return renderReports(p);
  app.append(el('div', {className: 'bartool'}, el('span', {className: 'sp'}),
    mode === 'kan' ? columnsMenu(p) : '',
    mode === 'kan' && allTasks(p).some(x => colOf(x.t) === 'todo') ? el('button', {textContent: 'Move all To Do → Backlog', title: 'Send every To Do item back to the backlog', on: {click: () => withUndo('Moved to Backlog', () => allTasks(p).forEach(({t}) => { if (colOf(t) === 'todo') setStatus(t, 'backlog'); }))}}) : '',
    mode === 'list' ? el('button', {textContent: 'Expand all', on: {click: () => setAll(true)}}) : '',
    mode === 'list' ? el('button', {textContent: 'Collapse all', on: {click: () => setAll(false)}}) : '',
    el('button', {className: 'pj', textContent: 'Archive project', on: {click: () => toggleArchive(p)}}),
    el('button', {className: 'pj', textContent: 'Delete project', on: {click: () => delProject(p)}})));
  if (mode === 'kan') return renderKanban(p);
  if (mode === 'cal') return renderCal(p);
  if (mode === 'tbl') return renderTable(p);
  if (mode === 'tl') return renderTimeline(p, 'tasks');

  if (!p.phases.length) app.append(el('div', {className: 'empty', textContent: 'No epics yet. Add one below or create a project from a template.'}));

  // Two columns: epic list on the left, stories and tasks of open epics on the right
  const side = el('div', {className: 'side'}), detail = el('div', {className: 'detail'});
  p.phases.forEach((ph, pi) => {
    const pc = '--pc:' + epicColor(ph, pi);
    side.append(el('section', {className: 'ph' + (ph.open ? ' on' : ''), style: pc}, head(ph, p.phases, pi, stat(tasksOf(ph)), 'Epic name', 'Epic deleted'), bar(stat(tasksOf(ph)).pct)));
    if (ph.open) {
      const box = el('section', {className: 'dp', style: pc}, el('h3', {textContent: ph.name}));
      ph.subs.forEach((sb, si) => {
        const inp = el('input', {type: 'text', placeholder: 'What needs to be done?'});
        const add = () => { const v = inp.value.trim(); if (v) { const nt = mk(v); logT(nt, 'Created'); sb.tasks.push(nt); save(); render(); } };
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
        const sbox = el('div', {className: 'sb'}, head(sb, ph.subs, si, stat(sb.tasks), 'Story name', 'Story deleted'), bar(stat(sb.tasks).pct));
        if (sb.open) {
          sb.tasks.forEach((t, ti) => { if (pass(t)) sbox.append(taskRow(t, sb.tasks, ti)); });
          sbox.append(el('div', {className: 'add'}, inp, el('button', {textContent: 'Create', on: {click: add}})));
        }
        box.append(dropTasks(sbox, sb));
      });
      box.append(el('div', {className: 'tools'}, el('button', {textContent: '+ Add story', on: {click: () => ask('Story name', '', n => { ph.subs.push({id: uid(), name: n, open: true, tasks: []}); save(); render(); })}})));
      detail.append(box);
    }
  });
  if (!detail.children.length && p.phases.length) detail.append(el('div', {className: 'empty', textContent: 'Select an epic on the left to see its stories and tasks.'}));

  side.append(el('button', {className: 'pri', textContent: '+ Add epic', on: {click: () => ask('Epic name', '', n => { p.phases.push({id: uid(), name: n, open: true, subs: [{id: uid(), name: 'Tasks', open: true, tasks: []}]}); save(); render(); })}}));
  app.append(el('div', {className: 'split'}, side, detail));
}

