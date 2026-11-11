/* js/admin/account.js: Sign-in, create account and account dialogs */

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
