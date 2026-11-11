/* js/admin/roles-screen.js: Members & Roles screen: permissions, users and the allowed-email list */

function allowSection() {
  if (!cloud.allow && !cloud.loadingAllow) {
    cloud.loadingAllow = true;
    FB.listAllowlist().then(l => { cloud.allow = l; }, e => { cloud.allow = []; info(cloudErr(e)); }).finally(() => { cloud.loadingAllow = false; render(); });
  }
  const inp = el('input', {type: 'text', placeholder: 'email@company.com'});
  const add = async () => {
    const m = inp.value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)) return info('Enter a valid email address.');
    try { await FB.allow(m, cloud.user.uid); cloud.allow = null; render(); info(m + ' can now create an account and sign in.'); } catch (e) { info(cloudErr(e)); }
  };
  return el('section', {className: 'allow'}, el('h4', {textContent: 'Allowed email addresses' + (cloud.allow ? ' (' + cloud.allow.length + ')' : '')}),
    el('p', {className: 'mut', textContent: 'Only these addresses, plus admins and executives, can use the workspace. Inviting someone to a project adds them here automatically.'}),
    ...(cloud.allow || []).map(x => el('div', {className: 'mrow'}, ava(x.email), el('div', {className: 'mi'}, el('b', {textContent: x.email}), el('small', {className: 'mut', textContent: x.pid ? 'Invited to a project' : 'Added by an admin'})),
      ic('×', 'Remove access', async () => { try { await FB.disallow(x.email); cloud.allow = null; render(); info(x.email + ' can no longer sign in.'); } catch (e) { info(cloudErr(e)); } }, 'del'))),
    el('div', {className: 'add'}, inp, el('button', {textContent: 'Allow', on: {click: add}})));
}
function usersBody(r) {
  const wrap = el('div', {});
  const invite = el('p', {}, el('button', {className: 'pri', textContent: '+ Invite user', on: {click: inviteUserDlg}}));
  if (!cloud.user) { wrap.append(el('p', {className: 'mut', textContent: 'Sign in to see and manage people.'}), el('button', {className: 'pri', textContent: 'Sign in', on: {click: () => signInDlg()}})); return wrap; }
  if (r.scope === 'Organization') {
    if (cloud.role !== 'admin') {
      wrap.append(el('p', {className: 'mut', textContent: r.id === (cloud.role || 'member') ? 'This is your organization role (' + cloud.user.email + '). Only admins can see everyone.' : 'Only admins can see everyone in this role.'}), invite);
      return wrap;
    }
    if (!cloud.users && !cloud.loadingUsers) {
      cloud.loadingUsers = true;
      FB.listUsers().then(u => { cloud.users = u; }, e => { cloud.users = []; info(cloudErr(e)); }).finally(() => { cloud.loadingUsers = false; render(); });
    }
    // One table with everyone. Role changes are staged and only applied when Save is pressed.
    const all = (cloud.users || []).slice().sort((a, b) => String(a.email || a.id).localeCompare(String(b.email || b.id)));
    const roleName = k => (ORG_ROLES.find(x => x[0] === k) || [k, k])[1];
    const barBox = el('div', {});
    const upd = () => barBox.replaceChildren(saveBar(Object.keys(userDraft).length, 'role change', saveUserRoles, () => { userDraft = {}; render(); }));
    const rows = all.map(u => {
      const self = u.id === cloud.user.uid, saved = u.role || 'member';
      const tr = el('tr', {className: userDraft[u.id] ? 'chg' : ''});
      const sel = el('select', {disabled: self, title: self ? 'You cannot change your own role' : '', on: {change: e => {
        if (e.target.value === saved) delete userDraft[u.id]; else userDraft[u.id] = e.target.value;
        tr.className = userDraft[u.id] ? 'chg' : ''; upd();
      }}}, ...ORG_ROLES.map(([k, l]) => el('option', {value: k, textContent: l})));
      sel.value = userDraft[u.id] || saved;
      tr.append(el('td', {}, ava(u.email || '?'), ' ' + (u.email || u.id) + (self ? ' (you)' : '')), el('td', {textContent: roleName(saved)}), el('td', {}, sel));
      return tr;
    });
    upd();
    wrap.append(barBox, el('div', {className: 'tblw'}, el('table', {className: 'tbl'}, el('thead', {}, el('tr', {}, ...['User', 'Current role', 'New role'].map(h => el('th', {textContent: h})))), el('tbody', {}, ...rows))),
      !cloud.users ? el('p', {className: 'mut', textContent: 'Loading users…'}) : all.length ? '' : el('p', {className: 'mut', textContent: 'No users have signed in yet.'}), invite, allowSection());
    return wrap;
  }
  const rows = [];
  db.projects.filter(p => p.cloudId).forEach(p => { const m = cloud.meta[p.cloudId]; if (m) Object.entries(m.members).forEach(([uid2, role]) => { if (role === r.id) rows.push({p, email: m.emails[uid2] || uid2, you: uid2 === cloud.user.uid}); }); });
  wrap.append(rows.length ? el('div', {className: 'tblw'}, el('table', {className: 'tbl'}, el('thead', {}, el('tr', {}, ...['User', 'Project'].map(h => el('th', {textContent: h})))),
    el('tbody', {}, ...rows.map(x => el('tr', {style: 'cursor:pointer', on: {click: () => membersDlg(x.p)}}, el('td', {}, ava(x.email), ' ' + x.email + (x.you ? ' (you)' : '')), el('td', {textContent: x.p.name})))))) : el('p', {className: 'mut', textContent: 'Nobody has this project role yet.'}), invite);
  return wrap;
}
function renderRoles() {
  const r = ROLES.find(x => x.id === roleSel) || ROLES[0], admin = !!cloud.user && cloud.role === 'admin', canEditPerms = !cloud.user || admin;
  const item = x => el('button', {className: 'ri' + (x.id === r.id ? ' on' : ''), on: {click: () => { roleSel = x.id; render(); }}},
    el('span', {className: 'pn', textContent: x.name}), x.default ? el('span', {className: 'tagdef', textContent: 'Default'}) : '');
  const list = el('div', {className: 'rl-list'},
    el('button', {className: 'newb', textContent: '+ New role', on: {click: () => soon('Custom roles', 'Custom roles will be added in a later release. The seven standard roles are available now.')}}),
    el('div', {className: 'sec', textContent: 'Organization roles'}), ...ROLES.filter(x => x.scope === 'Organization').map(item),
    el('div', {className: 'sec', textContent: 'Project roles'}), ...ROLES.filter(x => x.scope === 'Project').map(item));

  let body;
  if (roleTab === 'perm') {
    // Checkbox changes are staged in permDraft and only applied (and sent to everyone) when Save is pressed.
    const on = new Set(r.locked ? ALL_PERMS : (permDraft || db.roles || {})[r.id] || r.perms);
    const barBox = el('div', {});
    const upd = () => barBox.replaceChildren(saveBar(permDirty(), 'role change', savePerms, () => { permDraft = null; render(); }));
    body = el('div', {}, barBox);
    if (r.locked) body.append(el('p', {className: 'mut', textContent: 'The Admin role is locked: it always has every permission and cannot be edited. Choose another role on the left to change its permissions.'}));
    PERM_GROUPS.forEach(([g, items]) => {
      body.append(el('h4', {textContent: g}));
      items.forEach(([k, l]) => {
        const cb = el('input', {type: 'checkbox', checked: on.has(k), disabled: !!r.locked || !canEditPerms, on: {change: () => {
          permDraft = permDraft || JSON.parse(JSON.stringify(db.roles || {}));
          cb.checked ? on.add(k) : on.delete(k); permDraft[r.id] = [...on]; upd();
        }}});
        body.append(el('label', {className: 'pr'}, cb, el('span', {textContent: l})));
      });
    });
    if (!r.locked && canEditPerms && (permDraft || db.roles || {})[r.id]) body.append(el('button', {textContent: 'Reset to default', on: {click: () => { permDraft = permDraft || JSON.parse(JSON.stringify(db.roles || {})); delete permDraft[r.id]; render(); }}}));
    upd();
  } else if (roleTab === 'audit' && admin) body = auditBody();
  else body = usersBody(r);

  const bar = !cloud.user ? el('div', {className: 'infobar', textContent: 'Sign in to manage real people and roles. Until then, changes here are only a preview on this device.'})
    : admin ? el('div', {className: 'infobar', textContent: 'You are an admin. Change roles or permissions, then press Save: nothing is applied until you do, and saved permission changes apply to everyone. The server decides who can read, edit and delete each project; the finer permissions below are applied by the app when someone edits.'})
    : el('div', {className: 'infobar', textContent: 'Only an admin can change permissions. Your organization role: ' + (cloud.role || 'member') + '.'});
  const main = el('div', {className: 'rl-main'}, bar,
    el('h2', {textContent: r.name}), el('p', {className: 'mut', textContent: r.scope + ' role · ' + r.desc}),
    el('div', {className: 'tabs rtabs'}, ...[['perm', 'Permissions'], ['users', 'Users'], ...(admin ? [['audit', 'Audit log']] : [])].map(([k, l]) => el('button', {className: roleTab === k ? 'pri' : '', textContent: l, on: {click: () => { roleTab = k; render(); }}}))),
    body);
  $('#app').append(el('div', {className: 'rl'}, list, main));
}
