/* ---------- Accounts, members & roles ----------
   Sign-in, invites and role enforcement need cloud accounts (Firebase), which are not set up yet.
   The screens exist; actions that need the cloud show a "Coming soon" notice. */
const PERM_GROUPS = [
  ['Projects', [['p_create', 'Create projects'], ['p_view_all', 'View all projects'], ['p_archive', 'Archive / delete projects'], ['p_export', 'Export projects'], ['p_import', 'Import projects']]],
  ['Members', [['m_manage', 'Add / remove project members'], ['u_manage', 'Manage users and roles']]],
  ['Structure', [['e_edit', 'Edit epics and stories']]],
  ['Tasks', [['t_create', 'Create tasks'], ['t_edit_any', 'Edit any task'], ['t_edit_own', 'Edit assigned tasks / change status'], ['t_delete', 'Delete tasks']]]];
const ALL_PERMS = PERM_GROUPS.flatMap(g => g[1].map(x => x[0]));
const ROLES = [
  {id: 'admin', name: 'Admin', scope: 'Organization', locked: true, desc: 'Full access. Manages users, roles and all projects.', perms: ALL_PERMS},
  {id: 'executive', name: 'Executive', scope: 'Organization', desc: 'Read-only view of all projects.', perms: ['p_view_all', 'p_export']},
  {id: 'member', name: 'Member', scope: 'Organization', default: true, desc: 'Default for new users. Sees only the projects they are added to.', perms: []},
  {id: 'pm', name: 'Project Manager', scope: 'Project', desc: 'Owns projects and manages their members.', perms: ['p_create', 'p_archive', 'p_export', 'p_import', 'm_manage', 'e_edit', 't_create', 't_edit_any', 't_edit_own', 't_delete']},
  {id: 'lead', name: 'Team Lead', scope: 'Project', desc: 'Manages epics, stories and all tasks.', perms: ['e_edit', 't_create', 't_edit_any', 't_edit_own', 't_delete']},
  {id: 'contrib', name: 'Contributor', scope: 'Project', desc: 'Creates tasks and updates assigned work.', perms: ['t_create', 't_edit_own']},
  {id: 'viewer', name: 'Viewer', scope: 'Project', desc: 'Read-only access to a project.', perms: []}];
const rolePerms = r => r.locked ? ALL_PERMS : (db.roles && db.roles[r.id]) || r.perms;
let roleSel = 'admin', roleTab = 'perm';
let permDraft = null, userDraft = {};   // staged (unsaved) permission and user-role changes
const permKey = a => a ? JSON.stringify([...a].sort()) : '';
const permDirty = () => { if (!permDraft) return 0; const o = db.roles || {}; return [...new Set([...Object.keys(o), ...Object.keys(permDraft)])].filter(id => permKey(o[id]) !== permKey(permDraft[id])).length; };
const saveBar = (n, what, onSave, onDiscard) => n ? el('div', {className: 'savebar'}, el('span', {textContent: n + ' unsaved ' + what + (n > 1 ? 's' : '')}), el('span', {className: 'sp'}),
  el('button', {textContent: 'Discard', on: {click: onDiscard}}), el('button', {className: 'pri', textContent: 'Save', on: {click: onSave}})) : '';
async function savePerms() {
  if (!permDraft) return;
  const prev = db.roles;
  db.roles = permDraft;
  if (cloud.user) { try { await FB.saveRoles(db.roles); } catch (e) { db.roles = prev; info(cloudErr(e)); render(); return; } }
  permDraft = null; saveLocal(); render(); info('Permissions saved.');
}
async function saveUserRoles() {
  const ids = Object.keys(userDraft); if (!ids.length) return;
  const bad = [];
  for (const id of ids) {
    const u = (cloud.users || []).find(x => x.id === id);
    try { await FB.setUserRole(id, userDraft[id], u && u.email); if (u) u.role = userDraft[id]; delete userDraft[id]; }
    catch (e) { bad.push(((u && u.email) || id) + ': ' + cloudErr(e)); }
  }
  render(); info(bad.length ? 'Not saved — ' + bad.join('; ') : ids.length + ' role' + (ids.length > 1 ? 's' : '') + ' saved.');
}
const SOON_WHY = 'This feature is coming in an upcoming update. Everything else works already and your data stays safe.';
const soonBar = txt => el('div', {className: 'soonbar'}, el('b', {textContent: '🚧 Coming soon'}), el('span', {textContent: ' — ' + txt}));

function soon(feature, why) {
  openDlg('Coming soon', el('div', {className: 'soon'}, el('div', {className: 'soonico', textContent: '🚧'}), el('b', {textContent: feature}), el('p', {className: 'mut', textContent: why || SOON_WHY})), null);
}

