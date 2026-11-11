/* js/core/dnd.js: Drag and drop (mouse and touch) */

// Drag and drop: hold the handle (⠿) and drop onto another row.
// Mouse: HTML5 drag & drop. Touch/pen: pointer events (target found via elementFromPoint).
// Tasks can be moved to another story; epics and stories can only be reordered within their own group.
const COARSE = matchMedia('(pointer:coarse)').matches;
let drag = null;
const clearOver = () => document.querySelectorAll('.over').forEach(n => n.classList.remove('over'));
function touchDrag(e, d) {
  if (e.pointerType === 'mouse') return;
  e.preventDefault(); drag = d;
  const g = e.currentTarget; let tgt = null;
  try { g.setPointerCapture(e.pointerId); } catch (x) {}
  const move = ev => {
    if (ev.clientY < 70) scrollBy(0, -14); else if (ev.clientY > innerHeight - 70) scrollBy(0, 14);
    const n = document.elementFromPoint(ev.clientX, ev.clientY), z = n && n.closest('.dz');
    clearOver(); tgt = z && z._dz.ok() ? z : null; if (tgt) tgt.classList.add('over');
  };
  const end = ev => {
    g.removeEventListener('pointermove', move); g.removeEventListener('pointerup', end); g.removeEventListener('pointercancel', end);
    clearOver();
    if (tgt && ev.type === 'pointerup') tgt._dz.go(); else drag = null;
  };
  g.addEventListener('pointermove', move); g.addEventListener('pointerup', end); g.addEventListener('pointercancel', end);
}
function grip(arr, i, getBox, kind) {
  return el('span', {className: 'grip', textContent: '⠿', title: 'Drag to reorder', draggable: !COARSE, on: {
    click: e => e.stopPropagation(),
    pointerdown: e => touchDrag(e, {arr, i, kind}),
    dragstart: e => { e.stopPropagation(); drag = {arr, i, kind}; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'x'); const b = getBox(); if (b) e.dataTransfer.setDragImage(b, 10, 10); },
    dragend: () => { drag = null; clearOver(); }}});
}
function bindDz(node, dz) {
  node.classList.add('dz'); node._dz = dz;
  node.addEventListener('dragover', e => { if (dz.ok()) { e.preventDefault(); e.stopPropagation(); node.classList.add('over'); } });
  node.addEventListener('dragleave', () => node.classList.remove('over'));
  node.addEventListener('drop', e => { if (!dz.ok()) return; e.preventDefault(); e.stopPropagation(); dz.go(); });
  return node;
}
function dropZone(row, arr, i, kind) {
  return bindDz(row, {
    ok: () => drag && (drag.arr === arr || (kind === 'task' && drag.kind === 'task')),
    go: () => {
      const fa = drag.arr, from = drag.i; drag = null;
      if (fa !== arr || from !== i) { const [x] = fa.splice(from, 1); arr.splice(i, 0, x); save(); }
      render();
    }});
}
// A task dropped on a story box is appended to that story (for empty/collapsed stories)
function dropTasks(box, sb) {
  return bindDz(box, {
    ok: () => drag && drag.kind === 'task' && drag.arr !== sb.tasks,
    go: () => { const fa = drag.arr, from = drag.i; drag = null; sb.tasks.push(fa.splice(from, 1)[0]); save(); render(); }});
}
