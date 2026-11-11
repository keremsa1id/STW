/* js/admin/members.js: Project members dialog and invitations */

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
