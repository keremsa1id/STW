/* ---------- UI ---------- */
function el(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const k in attrs || {}) {
    if (k === 'on') for (const ev in attrs.on) e.addEventListener(ev, attrs.on[ev]);
    else if (k in e) e[k] = attrs[k]; else e.setAttribute(k, attrs[k]);
  }
  kids.flat().forEach(c => e.append(c));
  return e;
}
const ic = (txt, title, fn, cls, dis) => el('button', {className: 'ic ' + (cls || ''), textContent: txt, title, disabled: !!dis, on: {click: fn}});
const bar = pct => el('div', {className: 'bar'}, el('i', {style: 'width:' + pct + '%'}));

/* --- Undo: a snapshot is taken before delete/archive; an "Undo" button shows for 8 s (Ctrl+Z works too) --- */
let undoCb = null, toastT = 0;
function hideToast() { $('#toast').hidden = true; undoCb = null; clearTimeout(toastT); }
function toast(msg, cb, label) {
  const t = $('#toast'); undoCb = cb; clearTimeout(toastT);
  t.replaceChildren(el('span', {textContent: msg}), el('button', {textContent: label || 'Undo', on: {click: () => { if (cb) cb(); hideToast(); }}}));
  t.hidden = false; toastT = setTimeout(hideToast, 8000);
}
function withUndo(msg, fn) {
  const snap = JSON.stringify({cur: db.cur, projects: db.projects});
  fn(); save(); render();
  toast(msg, () => { const o = JSON.parse(snap); db.projects = o.projects; db.cur = o.cur; save(); render(); });
}
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && undoCb && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); undoCb(); hideToast(); }
});

