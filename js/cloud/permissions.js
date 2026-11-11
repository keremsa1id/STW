/* js/cloud/permissions.js: Who may do what: role lookup, permission checks, locked (view-only) screens */

/* ---- Who may do what ---- */
function roleIn(p) {
  if (!cloud.user || !p.cloudId) return {all: true, role: 'local', perms: new Set(ALL_PERMS)};
  if (cloud.role === 'admin') return {all: true, role: 'admin', perms: new Set(ALL_PERMS)};
  const m = cloud.meta[p.cloudId], r = (m && m.members[cloud.user.uid]) || '', def = ROLES.find(x => x.id === r);
  return {all: false, role: r || (cloud.role === 'executive' ? 'executive' : ''), perms: new Set(def ? rolePerms(def) : [])};
}
const canEditProject = p => { const i = roleIn(p); return i.all || ['pm', 'lead', 'contrib'].includes(i.role); };
const canManage = p => { const i = roleIn(p); return i.all || (['pm'].includes(i.role) && i.perms.has('m_manage')); };
// Finer permissions are checked here: if a change is not allowed, the project snaps back to its last synced state.
function permViolation(p, i) {
  let o, n; try { o = JSON.parse(cloud.sj[p.cloudId]); n = JSON.parse(projJson(p)); } catch (e) { return ''; }
  const has = k => i.all || (['pm', 'lead', 'contrib'].includes(i.role) && i.perms.has(k));
  const em = cloud.user.email.toLowerCase();
  const mine = t => { const w = String(t.who || '').trim().toLowerCase(); return !!w && (w === me().toLowerCase() || w === em || w === em.split('@')[0]); };
  const flat = x => {
    const e = {}, s = {}, t = {};
    (x.phases || []).forEach(ph => { e[ph.id] = {name: ph.name, color: ph.color || ''}; (ph.subs || []).forEach(sb => { s[sb.id] = {name: sb.name, ph: ph.id}; (sb.tasks || []).forEach(tk => { t[tk.id] = Object.assign({}, tk, {__s: sb.id}); }); }); });
    return {e, s, t};
  };
  const a = flat(o), b = flat(n), S = JSON.stringify;
  if ((S(a.e) !== S(b.e) || S(a.s) !== S(b.s)) && !has('e_edit')) return 'edit epics and stories';
  if (S(o.sprints) !== S(n.sprints) && !has('e_edit')) return 'manage sprints';
  if ((o.name !== n.name || !!o.archived !== !!n.archived) && !has('p_archive')) return 'rename or archive the project';
  for (const id in b.t) if (!a.t[id] && !has('t_create')) return 'create work items';
  for (const id in a.t) if (!b.t[id] && !has('t_delete')) return 'delete work items';
  for (const id in b.t) if (a.t[id] && S(a.t[id]) !== S(b.t[id]) && !(has('t_edit_any') || (has('t_edit_own') && (mine(a.t[id]) || mine(b.t[id]))))) return 'edit this work item';
  return '';
}
function guardPerms() {
  if (!cloud.user || !cloud.loaded) return false;
  let why = '';
  db.projects.forEach(p => {
    if (!p.cloudId || !cloud.rj[p.cloudId] || !cloud.sj[p.cloudId]) return;
    const i = roleIn(p); if (i.all || projJson(p) === cloud.sj[p.cloudId]) return;
    const v = permViolation(p, i); if (!v) return;
    try { applyRemote(p, p.cloudId, JSON.parse(cloud.rj[p.cloudId]), cloud.rj[p.cloudId]); why = v; } catch (e) {}
    if (taskCtx && taskCtx.p === p) { const nt = taskOf(p, taskCtx.t.id); if (nt) taskCtx.t = nt; }
  });
  if (why) { info('You do not have permission to ' + why + ' in this project, so the change was not kept.'); saveLocal(); }
  return !!why;
}
function roBanner() {
  if (!cloud.user || (view !== 'project' && view !== 'task')) return '';
  const p = view === 'task' && taskCtx ? taskCtx.p : cur(); if (!p || !p.cloudId) return '';
  const i = roleIn(p); if (i.all) return '';
  const can = canEditProject(p) && ['t_create', 't_edit_any', 't_edit_own', 'e_edit'].some(k => i.perms.has(k));
  return can ? '' : el('div', {className: 'sum rob', textContent: '👁 View only: you can look around, but changes here will not be saved.'});
}
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
