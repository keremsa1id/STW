/* Firebase (loaded from Google's CDN, no build step). The web config below is public by design;
   access is protected by Firebase Authentication and the Firestore security rules (see firestore.rules). */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, sendEmailVerification }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, deleteField, arrayUnion, arrayRemove }
  from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const app = initializeApp({
  apiKey: 'AIzaSyB_cbkk2y3-0lQMSraWbBtUHE8osLqu4Lg',
  authDomain: 'stw1-f52f2.firebaseapp.com',
  projectId: 'stw1-f52f2',
  storageBucket: 'stw1-f52f2.firebasestorage.app',
  messagingSenderId: '970044084505',
  appId: '1:970044084505:web:a24ad19599d7b0b95e7588'
});
const auth = getAuth(app);
let fs;
try { fs = initializeFirestore(app, {localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})}); }
catch (e) { fs = getFirestore(app); }

window.FB = {
  // --- accounts ---
  onAuth: cb => onAuthStateChanged(auth, cb),
  signIn: (email, pw) => signInWithEmailAndPassword(auth, email, pw),
  async signUp(email, pw) {
    const c = await createUserWithEmailAndPassword(auth, email, pw);
    try { await sendEmailVerification(c.user); } catch (e) {}
    return c;
  },
  signOut: () => signOut(auth),
  reset: email => sendPasswordResetEmail(auth, email),
  verify: () => sendEmailVerification(auth.currentUser),
  async refresh() { await auth.currentUser.reload(); await auth.currentUser.getIdToken(true); return auth.currentUser.emailVerified; },
  ts: () => serverTimestamp(),
  newId: () => doc(collection(fs, 'projects')).id,
  async ensureUser(uid, email, mayCreate) {
    const ref = doc(fs, 'users', uid), s = await getDoc(ref);
    if (s.exists()) return s.data().role || 'member';
    if (!mayCreate) return '';
    await setDoc(ref, {email, role: 'member', createdAt: serverTimestamp()});
    return 'member';
  },
  async isAllowed(email) { return (await getDoc(doc(fs, 'allowlist', email))).exists(); },
  allow: (email, byUid, pid) => setDoc(doc(fs, 'allowlist', email), Object.assign({email, invitedBy: byUid, createdAt: serverTimestamp()}, pid ? {pid} : {})),
  disallow: email => deleteDoc(doc(fs, 'allowlist', email)),
  async listAllowlist() { const s = await getDocs(collection(fs, 'allowlist')); return s.docs.map(d => d.data()); },
  // --- projects ---
  watchProjects: (uid, next, err, all) => onSnapshot(all ? collection(fs, 'projects') : query(collection(fs, 'projects'), where('memberIds', 'array-contains', uid)), next, err),
  createProject: (id, data) => setDoc(doc(fs, 'projects', id), data),
  updateProject: (id, data) => updateDoc(doc(fs, 'projects', id), data),
  deleteProject: id => deleteDoc(doc(fs, 'projects', id)),
  // --- members and invitations ---
  setMember: (pid, uid, role) => updateDoc(doc(fs, 'projects', pid), {['members.' + uid]: role}),
  removeMember: (pid, uid) => updateDoc(doc(fs, 'projects', pid), {['members.' + uid]: deleteField(), ['memberEmails.' + uid]: deleteField(), memberIds: arrayRemove(uid)}),
  async invite(pid, projectName, email, role, byUid) {
    await setDoc(doc(fs, 'allowlist', email), {email, pid, invitedBy: byUid, createdAt: serverTimestamp()});
    await setDoc(doc(fs, 'invites', pid + '_' + email), {pid, projectName, email, role, invitedBy: byUid, createdAt: serverTimestamp()});
  },
  async listInvites(pid) { const s = await getDocs(query(collection(fs, 'invites'), where('pid', '==', pid))); return s.docs.map(d => Object.assign({id: d.id}, d.data())); },
  revokeInvite: id => deleteDoc(doc(fs, 'invites', id)),
  async claimInvites(uid, email) {
    const s = await getDocs(query(collection(fs, 'invites'), where('email', '==', email)));
    let n = 0;
    for (const d of s.docs) {
      const iv = d.data();
      await updateDoc(doc(fs, 'projects', iv.pid), {['members.' + uid]: iv.role, ['memberEmails.' + uid]: email, memberIds: arrayUnion(uid)});
      await deleteDoc(d.ref); n++;
    }
    return n;
  },
  // --- people and role permissions (admin) ---
  async listUsers() { const s = await getDocs(collection(fs, 'users')); return s.docs.map(d => Object.assign({id: d.id}, d.data())); },
  setUserRole: (uid, role) => updateDoc(doc(fs, 'users', uid), {role}),
  watchRoles: (cb, err) => onSnapshot(doc(fs, 'config', 'roles'), s => cb(s.exists() ? s.data().perms || null : null), err),
  saveRoles: perms => setDoc(doc(fs, 'config', 'roles'), {perms, updatedAt: serverTimestamp()}),
  // --- audit log (append-only; the rules let anyone add an entry as themselves, only admins read, nobody edits or deletes) ---
  async listAudit() { const s = await getDocs(query(collection(fs, 'audit'), orderBy('at', 'desc'), limit(300))); return s.docs.map(d => { const x = d.data(); return Object.assign({id: d.id}, x, {at: x.at && x.at.toMillis ? x.at.toMillis() : 0}); }); }
};
// Every sensitive action below writes one audit entry after it succeeds. The entry carries the signed-in uid/email and a server timestamp.
const audit = (action, target, detail) => {
  const u = auth.currentUser; if (!u) return;
  addDoc(collection(fs, 'audit'), {uid: u.uid, email: String(u.email || '').toLowerCase(), action, target: String(target || '').slice(0, 200), detail: String(detail || '').slice(0, 300), at: serverTimestamp()}).catch(() => {});
};
window.FB.audit = audit;
const logged = (name, describe) => { const orig = window.FB[name]; window.FB[name] = async (...a) => { const r = await orig(...a); try { const d = describe(r, ...a); if (d) audit(d[0], d[1], d[2]); } catch (e) {} return r; }; };
logged('setUserRole', (r, uid, role, email) => ['user.role', email || uid, 'organization role → ' + role]);
logged('saveRoles', () => ['roles.save', '', 'role permissions updated']);
logged('allow', (r, email, by, pid) => ['allowlist.add', email, pid ? 'via project invite' : 'added by an admin']);
logged('disallow', (r, email) => ['allowlist.remove', email, 'access removed']);
logged('invite', (r, pid, pname, email, role) => ['invite.send', email, 'project "' + pname + '" as ' + role]);
logged('revokeInvite', (r, id) => ['invite.cancel', id, 'invitation cancelled']);
logged('setMember', (r, pid, uid, role, email, pname) => ['member.role', email || uid, 'project "' + (pname || pid) + '" role → ' + role]);
logged('removeMember', (r, pid, uid, email, pname) => ['member.remove', email || uid, 'removed from project "' + (pname || pid) + '"']);
logged('createProject', (r, id, data) => ['project.create', data && data.name, 'id ' + id]);
logged('deleteProject', (r, id, name) => ['project.delete', name || id, 'id ' + id]);
logged('claimInvites', (r, uid, email) => r > 0 ? ['invite.accept', email, r + ' project invitation(s) accepted'] : null);
window.dispatchEvent(new Event('fb-ready'));
