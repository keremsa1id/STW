/* js/cloud/cloud.js: Firebase session, sign-in gate, sync with Firestore */

/* ---------- Cloud accounts, sharing & roles (Firebase) ----------
   Sign-in, cloud copies of projects, offline-tolerant sync, invitations, members and role enforcement. */
const cloud = {state: 'loading', access: 'checking', allow: null, loadingAllow: false, user: null, role: '', loaded: false, flagged: false, err: '', meta: {}, rj: {}, sj: {}, unsub: null, unsubRoles: null, timer: 0, users: null, loadingUsers: false};
const projJson = p => JSON.stringify(p, (k, v) => (k === 'open' || k === 'cloudId' || k === 'localOnly' || k === 'owner') ? undefined : v);
const saveLocal = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
const info = msg => toast(msg, null, 'OK');
const CLOUD_ERR = {
  'auth/invalid-credential': 'Wrong email or password.', 'auth/wrong-password': 'Wrong email or password.', 'auth/user-not-found': 'No account with this email.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in.', 'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'This email address is not valid.', 'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/network-request-failed': 'No internet connection.', 'auth/operation-not-allowed': 'Email/Password sign-in is not enabled in the Firebase console (Authentication → Sign-in method).',
  'permission-denied': 'Access denied by the Firestore rules. Publish the latest rules from firestore.rules in the Firebase console.', 'unavailable': 'The cloud is not reachable right now.'
};
const cloudErr = e => CLOUD_ERR[e && e.code] || (e && e.message) || 'Something went wrong.';
const ROLE_NAME = {pm: 'Project Manager', lead: 'Team Lead', contrib: 'Contributor', viewer: 'Viewer'};
const ORG_ROLES = [['admin', 'Admin'], ['executive', 'Executive'], ['member', 'Member']];
function cloudBoot() {
  const hook = () => { cloud.state = 'out'; FB.onAuth(onAuth); render(); };
  if (window.FB) return hook();
  addEventListener('fb-ready', hook, {once: true});
  setTimeout(() => { if (!window.FB && cloud.state === 'loading') { cloud.state = 'unavailable'; render(); } }, 10000);
}
// Invitation-only access. Nothing is shown until the signed-in person is an admin/executive,
// or their email is on the allowlist (set when someone invites them) and verified.
async function onAuth(u) {
  if (cloud.unsub) { cloud.unsub(); cloud.unsub = null; }
  if (cloud.unsubRoles) { cloud.unsubRoles(); cloud.unsubRoles = null; }
  Object.assign(cloud, {loaded: false, flagged: false, err: '', meta: {}, rj: {}, sj: {}, users: null, allow: null});
  permDraft = null; userDraft = {}; cloud.audit = null;
  clearTimeout(cloud.timer);
  if (!u) {
    cloud.user = null; cloud.role = ''; cloud.access = 'out';
    db.projects = db.projects.filter(p => !p.cloudId);            // cloud projects are not kept on the device after sign-out
    partitionLocal();                                             // device-only projects are parked until their owner signs in
    if (view === 'project' || view === 'task') { taskCtx = null; view = 'home'; }
    saveLocal(); render(); return;
  }
  cloud.user = {uid: u.uid, email: u.email, verified: !!u.emailVerified};
  await startSession();
}
async function startSession() {
  const u = cloud.user; if (!u) return;
  cloud.access = 'checking'; render();
  let listed = false, role = '';
  try { listed = await FB.isAllowed(u.email.toLowerCase()); } catch (e) { listed = false; }
  try { role = await FB.ensureUser(u.uid, u.email, listed && u.verified); } catch (e) { role = ''; }
  if (cloud.user !== u) return;                                   // signed out meanwhile
  cloud.role = role;
  if (role === 'admin' || role === 'executive') cloud.access = 'ok';
  else if (!listed) cloud.access = 'denied';
  else if (!u.verified) cloud.access = 'verify';
  else cloud.access = role ? 'ok' : 'denied';
  if (cloud.access !== 'ok') { db.projects = db.projects.filter(p => !p.cloudId); partitionLocal(); saveLocal(); render(); return; }
  partitionLocal();
  const all = role === 'admin' || role === 'executive';           // admins and executives can see every project
  cloud.unsub = FB.watchProjects(u.uid, onSnap, e => { cloud.err = cloudErr(e); info(cloud.err); render(); }, all);
  cloud.unsubRoles = FB.watchRoles(perms => { if (perms && JSON.stringify(perms) !== JSON.stringify(db.roles || {})) { db.roles = perms; saveLocal(); render(); } }, () => {});
  if (u.verified) claimInvites();
  saveLocal(); render();
}
async function refreshAccess(msgEl) {
  try {
    cloud.user.verified = await FB.refresh();
    if (cloud.user.verified) { if (dlg.open) dlg.close(); info('Email verified.'); await startSession(); }
    else if (msgEl) { msgEl.textContent = 'Not verified yet. Open the link in the email (check spam too), then try again.'; msgEl.className = 'form-msg err'; }
  } catch (e) { if (msgEl) { msgEl.textContent = cloudErr(e); msgEl.className = 'form-msg err'; } else info(cloudErr(e)); }
}
// Device-only projects belong to whoever created them here. Others are parked (kept on the device, not shown).
// Old projects without an owner are only shown to an admin, who then becomes their owner.
function partitionLocal() {
  const uid = cloud.user && cloud.access === 'ok' ? cloud.user.uid : null;
  const pool = [...(db.parked || []), ...db.projects.filter(p => !p.cloudId)];
  db.projects = db.projects.filter(p => p.cloudId); db.parked = [];
  pool.forEach(p => {
    if (uid && (p.owner === uid || (!p.owner && cloud.role === 'admin'))) { if (!p.owner) p.owner = uid; db.projects.push(p); }
    else db.parked.push(p);
  });
  if (!db.projects.some(p => p.id === db.cur)) db.cur = db.projects[0] ? db.projects[0].id : '';
}
const gateNeeded = () => cloud.access !== 'ok';
function renderGate() {
  const p = t => el('p', {className: 'mut', textContent: t}), msg = el('div', {className: 'form-msg'});
  const box = el('div', {className: 'gate'}, el('img', {className: 'gate-logo', src: 'logo.svg?v=3', alt: ''}), el('h2', {textContent: 'Project Tracker'}));
  const out = el('button', {textContent: 'Sign out', on: {click: () => FB.signOut()}});
  if (cloud.state === 'unavailable') box.append(p('Cannot reach the server. Check your internet connection and reload the page.'), el('button', {className: 'pri', textContent: 'Reload', on: {click: () => location.reload()}}));
  else if (cloud.state === 'loading' || cloud.access === 'checking') box.append(p('Connecting…'));
  else if (!cloud.user) box.append(p('This workspace is invitation only. Sign in with the email address you were invited with.'),
    el('button', {className: 'pri', textContent: 'Sign in', on: {click: () => signInDlg()}}),
    el('button', {textContent: 'I was invited: create my account', on: {click: () => signInDlg('up')}}));
  else if (cloud.access === 'verify') box.append(p('One more step: verify ' + cloud.user.email + '. We sent you a link (check the spam folder too).'), msg,
    el('button', {className: 'pri', textContent: 'I have verified', on: {click: () => refreshAccess(msg)}}),
    el('button', {textContent: 'Send the email again', on: {click: async () => { try { await FB.verify(); msg.textContent = 'Verification email sent.'; msg.className = 'form-msg'; } catch (e) { msg.textContent = cloudErr(e); msg.className = 'form-msg err'; } }}}), out);
  else box.append(p(cloud.user.email + ' has not been invited to this workspace. Ask an admin or a project manager to invite this address, then sign in again.'), out);
  $('#app').append(box);
}
async function claimInvites() {
  try { const n = await FB.claimInvites(cloud.user.uid, cloud.user.email.toLowerCase()); if (n) info(n + ' project invitation' + (n === 1 ? '' : 's') + ' accepted.'); }
  catch (e) { info(cloudErr(e)); }
}
function applyRemote(mine, id, o, json) {
  const open = {}; if (mine) mine.phases.forEach(ph => { open[ph.id] = ph.open; ph.subs.forEach(sb => { open[sb.id] = sb.open; }); });
  const p = mine || {id, cloudId: id};
  p.name = String(o.name || 'Untitled project'); p.archived = !!o.archived; p.sprints = normSprints(o.sprints); p.seq = +o.seq || 0;
  p.phases = (Array.isArray(o.phases) ? o.phases : []).map(ph => ({id: String(ph.id || uid()), name: String(ph.name || 'Epic'), open: !!open[ph.id], color: isHex(ph.color) ? ph.color : '',
    subs: (Array.isArray(ph.subs) ? ph.subs : []).map(sb => ({id: String(sb.id || uid()), name: String(sb.name || 'Story'), open: !!open[sb.id],
      tasks: (Array.isArray(sb.tasks) ? sb.tasks : []).map(t => ensureTask(mk(String(t.t || ''), t.done, t)))}))}));
  p.cloudId = id; if (!mine) db.projects.push(p);
  ensureProj(p); cloud.rj[id] = json; cloud.sj[id] = projJson(p);
}
function onSnap(snap) {
  let changed = false;
  snap.docChanges().forEach(ch => {
    const id = ch.doc.id, d = ch.doc.data(), mine = db.projects.find(p => p.cloudId === id);
    if (ch.type === 'removed') {
      delete cloud.meta[id]; delete cloud.rj[id]; delete cloud.sj[id];
      if (mine) { db.projects = db.projects.filter(p => p !== mine); changed = true; info('"' + mine.name + '" is no longer available to you.'); }
      return;
    }
    cloud.meta[id] = {members: d.members || {}, emails: d.memberEmails || {}, owner: d.ownerId || ''};
    if (ch.doc.metadata.hasPendingWrites || typeof d.json !== 'string' || cloud.rj[id] === d.json) { if (mine) changed = true; return; }
    if (mine && projJson(mine) !== cloud.sj[id]) return;           // unsynced local edits win (last writer wins)
    let o; try { o = JSON.parse(d.json); } catch (e) { return; }
    applyRemote(mine, id, o, d.json); changed = true;
  });
  cloud.loaded = true; cloud.err = '';
  if (!cloud.flagged) {
    cloud.flagged = true;
    db.projects.filter(p => !p.cloudId && p.localOnly === undefined).forEach(p => { p.localOnly = true; });
    if (db.projects.some(p => p.localOnly)) info('You have projects stored only on this device. Open your account to upload them.');
    changed = true;
  }
  if (!db.projects.some(p => p.id === db.cur)) db.cur = db.projects[0] ? db.projects[0].id : '';
  if (changed) { saveLocal(); render(); }
  scheduleCloud();
}
/* ---- Sync ---- */
function scheduleCloud() {
  if (!cloud.user || !cloud.loaded) return;
  clearTimeout(cloud.timer); cloud.timer = setTimeout(pushCloud, 1500);
}
async function createCloud(p) {
  const old = p.id, id = FB.newId(), json = projJson(p), u = cloud.user;
  if (json.length > 900000) throw new Error('"' + p.name + '" is too large to sync (limit about 1 MB).');
  p.id = id; p.cloudId = id; if (db.cur === old) db.cur = id;
  cloud.rj[id] = cloud.sj[id] = json;
  try {
    await FB.createProject(id, {name: p.name, json, ownerId: u.uid, memberIds: [u.uid], members: {[u.uid]: 'pm'}, memberEmails: {[u.uid]: u.email},
      createdAt: FB.ts(), updatedAt: FB.ts(), updatedBy: u.uid});
  } catch (e) {
    p.id = old; delete p.cloudId; if (db.cur === id) db.cur = old; delete cloud.rj[id]; delete cloud.sj[id]; throw e;
  }
  cloud.meta[id] = {members: {[u.uid]: 'pm'}, emails: {[u.uid]: u.email}, owner: u.uid};
}
let pushing = false, pushAgain = false;
async function pushCloud() {
  if (!cloud.user || !cloud.loaded) return;
  if (pushing) { pushAgain = true; return; }
  pushing = true;
  try {
    for (const p of [...db.projects]) {
      if (p.localOnly) continue;
      try {
        if (!p.cloudId) { await createCloud(p); continue; }
        if (!canEditProject(p)) continue;                                // view-only projects are never written
        const json = projJson(p); if (json === cloud.sj[p.cloudId]) continue;
        if (json.length > 900000) { info('"' + p.name + '" is too large to sync (limit about 1 MB).'); continue; }
        const before = cloud.sj[p.cloudId];
        await FB.updateProject(p.cloudId, {name: p.name, json, updatedAt: FB.ts(), updatedBy: cloud.user.uid});
        try { if (FB.audit && before) auditDiff(p.name, before, json).forEach(e => FB.audit(e[0], e[1], e[2])); } catch (e) {}   // who changed what, after the save succeeded
        cloud.rj[p.cloudId] = cloud.sj[p.cloudId] = json; cloud.err = '';
      } catch (e) { cloud.err = cloudErr(e); info('Could not save "' + p.name + '" to the cloud: ' + cloud.err); }
    }
  } finally { pushing = false; saveLocal(); render(); if (pushAgain) { pushAgain = false; scheduleCloud(); } }
}
async function uploadLocal() {
  const list = db.projects.filter(p => !p.cloudId);
  try { localStorage.setItem('proje-takip-yedek-' + Date.now(), localStorage.getItem(KEY) || ''); } catch (e) {}   // safety backup
  let ok = 0;
  for (const p of list) { try { p.localOnly = false; await createCloud(p); ok++; } catch (e) { p.localOnly = true; info(cloudErr(e)); } }
  saveLocal(); render(); info(ok + ' project' + (ok === 1 ? '' : 's') + ' uploaded to the cloud.');
}
// A project deleted here is removed from the cloud after a short grace period (so Undo still works)
async function sweepDeleted() {
  if (!cloud.user) return;
  for (const id of Object.keys(cloud.meta)) {
    if (db.projects.some(p => p.cloudId === id)) continue;
    try { await FB.deleteProject(id, (cloud.meta[id] || {}).name); delete cloud.meta[id]; delete cloud.rj[id]; delete cloud.sj[id]; }
    catch (e) { info('Could not delete the project from the cloud: ' + cloudErr(e)); }
  }
}
