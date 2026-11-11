/* js/admin/audit-screen.js: Audit log tab of the Members & Roles screen */

const AUDIT_LABEL = {'user.role': 'Organization role changed', 'roles.save': 'Role permissions saved', 'allowlist.add': 'Email allowed', 'allowlist.remove': 'Email access removed',
  'invite.send': 'Invitation sent', 'invite.cancel': 'Invitation cancelled', 'invite.accept': 'Invitation accepted', 'member.role': 'Project role changed',
  'member.remove': 'Removed from project', 'epic.add': 'Epic created', 'epic.edit': 'Epic edited', 'epic.delete': 'Epic deleted', 'story.add': 'Story created', 'story.edit': 'Story edited',
  'story.delete': 'Story deleted', 'task.create': 'Task created', 'task.delete': 'Task deleted', 'task.edit': 'Task edited', 'task.move': 'Task moved / status changed', 'project.edit': 'Project edited', 'project.bulk': 'Many changes', 'project.create': 'Project created in cloud', 'project.delete': 'Project deleted from cloud'};
function auditBody() {
  if (!cloud.audit && !cloud.loadingAudit) {
    cloud.loadingAudit = true;
    FB.listAudit().then(l => { cloud.audit = l; }, e => { cloud.audit = []; info(cloudErr(e)); }).finally(() => { cloud.loadingAudit = false; render(); });
  }
  const rows = (cloud.audit || []).map(a => el('tr', {},
    el('td', {textContent: a.at ? new Date(a.at).toLocaleString() : 'just now'}), el('td', {textContent: a.email || a.uid}),
    el('td', {textContent: AUDIT_LABEL[a.action] || a.action}), el('td', {textContent: a.target || ''}), el('td', {className: 'mut', textContent: a.detail || ''})));
  return el('div', {},
    el('p', {className: 'mut', textContent: 'Who did what, newest first (last 300 entries). Entries are added when the action succeeds and cannot be edited or deleted. Only admins can read this list.'}),
    el('p', {}, el('button', {textContent: '↻ Refresh', on: {click: () => { cloud.audit = null; render(); }}})),
    !cloud.audit ? el('p', {className: 'mut', textContent: 'Loading…'}) : rows.length ? el('div', {className: 'tblw'}, el('table', {className: 'tbl'},
      el('thead', {}, el('tr', {}, ...['When', 'Who', 'Action', 'Target', 'Details'].map(h => el('th', {textContent: h})))), el('tbody', {}, ...rows))) : el('p', {className: 'mut', textContent: 'Nothing recorded yet.'}));
}
