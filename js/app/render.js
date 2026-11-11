/* js/app/render.js: Main render loop */

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
  return renderList(p);
}
