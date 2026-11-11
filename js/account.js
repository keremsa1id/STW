/* ---- Sidebar button and dialogs ---- */
function accountBtn() {
  const b = el('button', {className: 'nv', on: {click: signInDlg}});
  if (cloud.user) b.append(el('span', {className: 'pn', textContent: '👤 ' + cloud.user.email}), el('i', {className: 'cdot' + (cloud.err ? ' bad' : ''), title: cloud.err || 'Connected to the cloud'}));
  else b.append(el('span', {className: 'pn', textContent: '👤 Sign in'}), cloud.state === 'unavailable' ? el('span', {className: 'badge', textContent: 'Offline'}) : '');
  return b;
}

function signInDlg(mode) {
  if (cloud.user) return accountDlg();
  if (cloud.state !== 'out') {
    openDlg('Sign in', el('p', {className: 'mut', textContent: cloud.state === 'loading' ? 'Connecting to the cloud… try again in a moment.' : 'Cloud services could not be loaded (you may be offline). The app keeps working on this device.'}), null); return;
  }
  const up = mode === 'up';
  const em = el('input', {type: 'text', placeholder: 'name@company.com', autocomplete: 'email'});
  const pw = el('input', {type: 'password', placeholder: up ? 'At least 6 characters' : 'Password', autocomplete: up ? 'new-password' : 'current-password'});
  const pw2 = up ? el('input', {type: 'password', placeholder: 'Repeat the password', autocomplete: 'new-password'}) : null;
  const msg = el('div', {className: 'form-msg'});
  const show = (t, bad) => { msg.textContent = t; msg.className = 'form-msg' + (bad ? ' err' : ''); };
  const submit = async () => {
    if (!em.value.trim()) { show('Enter your email address.', true); em.focus(); return; }
    if (!pw.value) { show('Enter your password.', true); pw.focus(); return; }
    if (up) {
      if (pw.value.length < 6) { show('The password must be at least 6 characters.', true); pw.focus(); return; }
      if (pw.value !== pw2.value) { show('The two passwords do not match.', true); pw2.focus(); return; }
    }
    show(up ? 'Creating your account…' : 'Signing in…');
    try { await (up ? FB.signUp : FB.signIn)(em.value.trim(), pw.value); dlg.close(); info(up ? 'Account created. Check your inbox to verify your email address: it is needed to accept project invitations.' : 'Signed in.'); }
    catch (e) { show(cloudErr(e), true); }
  };
  (up ? pw2 : pw).addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  const show2 = el('label', {className: 'chk'}, el('input', {type: 'checkbox', on: {change: e => { pw.type = e.target.checked ? 'text' : 'password'; if (pw2) pw2.type = pw.type; }}}), el('span', {textContent: 'Show password'}));
  openDlg(up ? 'Create account' : 'Sign in', el('div', {className: 'form'},
    up ? el('small', {className: 'mut', textContent: 'Only invited email addresses can join. Use the exact address the invitation was sent to.'}) : '',
    fld('Email', em), fld('Password', pw), up ? fld('Repeat password', pw2) : '', show2, msg,
    el('button', {className: 'pri', textContent: up ? 'Create account' : 'Sign in', on: {click: submit}}),
    up ? '' : el('button', {textContent: 'Forgot password?', on: {click: async () => {
      if (!em.value.trim()) { show('Enter your email first, then press this again.', true); em.focus(); return; }
      try { await FB.reset(em.value.trim()); show('Password reset email sent. Check your inbox.'); } catch (e) { show(cloudErr(e), true); }
    }}}),
    el('button', {className: 'link', textContent: up ? 'Already have an account? Sign in' : 'New here? Create an account', on: {click: () => signInDlg(up ? 'in' : 'up')}}),
    el('small', {className: 'mut', textContent: 'Your projects stay on this device until you upload them from the Account window.'})), null);
  em.focus();
}

function accountDlg() {
  const n = db.projects.filter(p => !p.cloudId).length, nc = db.projects.filter(p => p.cloudId).length, v = cloud.user.verified;
  const msg = el('div', {className: 'form-msg'});
  openDlg('Account', el('div', {className: 'form'},
    el('div', {className: 'mrow'}, ava(cloud.user.email), el('div', {className: 'mi'}, el('b', {textContent: cloud.user.email}), el('small', {className: 'mut', textContent: 'Role: ' + (cloud.role || 'member') + (v ? ' · email verified' : '')})), el('span', {className: 'chip', textContent: cloud.err ? 'Error' : 'Connected'})),
    v ? '' : el('div', {className: 'infobar'}, el('b', {textContent: 'Verify your email. '}), el('span', {textContent: 'You need a verified email to accept project invitations.'}),
      el('div', {className: 'tools'},
        el('button', {textContent: 'Send verification email', on: {click: async () => { try { await FB.verify(); msg.textContent = 'Verification email sent. Check your inbox.'; msg.className = 'form-msg'; } catch (e) { msg.textContent = cloudErr(e); msg.className = 'form-msg err'; } }}}),
        el('button', {className: 'pri', textContent: 'I have verified', on: {click: () => refreshAccess(msg)}}))),
    msg,
    cloud.err ? el('div', {className: 'form-msg err', textContent: cloud.err}) : el('small', {className: 'mut', textContent: nc + ' cloud project' + (nc === 1 ? '' : 's') + ' · changes are saved automatically'}),
    n ? el('button', {className: 'pri', textContent: '☁ Upload ' + n + ' device-only project' + (n === 1 ? '' : 's') + ' to the cloud', on: {click: () => {
      openDlg('Upload to cloud', el('p', {textContent: 'Your ' + n + ' device-only project' + (n === 1 ? '' : 's') + ' will be copied to your cloud account and then stay in sync across devices. A backup of your current data is saved on this device first.'}), () => { uploadLocal(); });
      $('#dlgOk').textContent = 'Upload';
    }}}) : el('small', {className: 'mut', textContent: 'Nothing left to upload.'}),
    el('button', {textContent: 'Sign out', on: {click: async () => { dlg.close(); await FB.signOut(); }}})), null);
}

async function membersDlg(p) {
  const note = (t, ...more) => openDlg('Members · ' + p.name, el('div', {className: 'form'}, el('p', {className: 'mut', textContent: t}), ...more), null);
  if (!cloud.user) return note('Sign in to share this project with other people.', el('button', {className: 'pri', textContent: 'Sign in', on: {click: () => signInDlg()}}));
  if (!p.cloudId) return note('This project is only on this device. Upload it to your cloud account to share it.', el('button', {className: 'pri', textContent: '☁ Open account to upload', on: {click: () => accountDlg()}}));
  const meta = cloud.meta[p.cloudId] || {members: {}, emails: {}, owner: ''}, manage = canManage(p), projRoles = ROLES.filter(r => r.scope === 'Project');
  let pend = []; if (manage) { try { pend = await FB.listInvites(p.cloudId); } catch (e) { pend = []; } }
  const again = () => membersDlg(p), fail = e => info(cloudErr(e));
  // Role changes and removals are staged here and applied only when Save is pressed. Invitations are sent right away.
  const dRole = {}, dDel = new Set();
  const hint = el('small', {className: 'mut'});
  const upd = () => { const n = Object.keys(dRole).length + dDel.size; hint.textContent = n ? n + ' unsaved change' + (n > 1 ? 's' : '') + ' — press Save to apply.' : ''; hint.style.fontWeight = n ? '600' : ''; };
  const rows = Object.entries(meta.members).map(([uid2, r]) => {
    const self = uid2 === cloud.user.uid, owner = uid2 === meta.owner;
    const name = (meta.emails[uid2] || uid2.slice(0, 8) + '…') + (self ? ' (you)' : '');
    let ctl, row, del = '';
    if (manage && !owner && !self) {
      ctl = el('select', {on: {change: e => { if (e.target.value === r) delete dRole[uid2]; else dRole[uid2] = e.target.value; upd(); }}}, ...projRoles.map(x => el('option', {value: x.id, textContent: x.name})));
      ctl.value = r;
      del = ic('×', 'Remove from project (applied on Save)', () => {
        if (dDel.has(uid2)) { dDel.delete(uid2); row.style.opacity = ''; ctl.disabled = false; } else { dDel.add(uid2); row.style.opacity = '.45'; ctl.disabled = true; }
        del.textContent = dDel.has(uid2) ? '↶' : '×'; upd();
      }, 'del');
    } else ctl = el('span', {className: 'chip', textContent: owner ? 'Owner' : (ROLE_NAME[r] || r)});
    row = el('div', {className: 'mrow'}, ava(name), el('div', {className: 'mi'}, el('b', {textContent: name}), el('small', {className: 'mut', textContent: owner ? 'Owner' : ''})), ctl, del);
    return row;
  });
  const saveAll = async () => {
    const jobs = [...Object.entries(dRole).filter(([u]) => !dDel.has(u)).map(([u, rl]) => [u, () => FB.setMember(p.cloudId, u, rl, meta.emails[u], p.name)]), ...[...dDel].map(u => [u, () => FB.removeMember(p.cloudId, u, meta.emails[u], p.name)])];
    if (!jobs.length) { dlg.close(); return; }
    const bad = [];
    for (const [u, fn] of jobs) { try { await fn(); } catch (e) { bad.push((meta.emails[u] || u) + ': ' + cloudErr(e)); } }
    if (bad.length) { info('Not saved — ' + bad.join('; ')); again(); } else { dlg.close(); info(jobs.length + ' change' + (jobs.length > 1 ? 's' : '') + ' saved.'); }
  };
  const pendRows = pend.map(iv => el('div', {className: 'mrow'}, ava(iv.email), el('div', {className: 'mi'}, el('b', {textContent: iv.email}), el('small', {className: 'mut', textContent: 'Invited · waiting for sign-up and email verification'})),
    el('span', {className: 'chip', textContent: ROLE_NAME[iv.role] || iv.role}), ic('×', 'Cancel invitation', () => FB.revokeInvite(iv.id).then(again, fail), 'del')));
  const em = el('input', {type: 'text', placeholder: 'email@company.com'}), role = el('select', {}, ...projRoles.map(r => el('option', {value: r.id, textContent: r.name})));
  role.value = 'contrib';
  const msg = el('div', {className: 'form-msg'});
  const send = async () => {
    const mail = em.value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { msg.textContent = 'Enter a valid email address.'; msg.className = 'form-msg err'; return; }
    if (Object.values(meta.emails).some(x => String(x).toLowerCase() === mail)) { msg.textContent = 'This person is already a member.'; msg.className = 'form-msg err'; return; }
    try { await FB.invite(p.cloudId, p.name, mail, role.value, cloud.user.uid); info('Invitation saved for ' + mail + '. The project appears for them once they sign up and verify their email.'); again(); } catch (e) { fail(e); }
  };
  openDlg('Members · ' + p.name, el('div', {className: 'form'},
    ...rows, hint, pendRows.length ? el('small', {className: 'mut', textContent: 'Pending invitations'}) : '', ...pendRows,
    manage ? el('div', {className: 'form'}, el('hr'), fld('Invite by email', em), fld('Project role', role), msg, el('button', {className: 'pri', textContent: 'Send invite', on: {click: send}}),
      el('small', {className: 'mut', textContent: 'The person signs up with this email address, verifies it, and the project shows up in their list.'}))
      : el('small', {className: 'mut', textContent: 'Only a Project Manager can add or remove people.'})), manage ? () => { saveAll(); return false; } : null);
}

function inviteUserDlg() {
  if (!cloud.user) return signInDlg();
  const ps = db.projects.filter(p => p.cloudId && canManage(p));
  if (!ps.length) return openDlg('Invite user', el('p', {className: 'mut', textContent: 'You need a cloud project you manage first. Upload one from your account window, then invite people to it.'}), null);
  if (ps.length === 1) return membersDlg(ps[0]);
  openDlg('Invite user: choose a project', el('div', {className: 'form'}, ...ps.map(p => el('button', {textContent: p.name, on: {click: () => membersDlg(p)}}))), null);
}

const saveRolesCloud = () => FB.saveRoles(db.roles || {}).catch(e => info(cloudErr(e)));

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

