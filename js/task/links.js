/* js/task/links.js: Links between work items */

const REL = {blocks: 'blocks', blocked_by: 'is blocked by', relates: 'relates to'};
const INV = {blocks: 'blocked_by', blocked_by: 'blocks', relates: 'relates'};
function addLink(p, t, rel, o) {
  if (t.links.some(l => l.rel === rel && l.to === o.id)) return;
  t.links.push({rel, to: o.id}); o.links.push({rel: INV[rel], to: t.id});
  logT(t, 'Linked: ' + REL[rel] + ' ' + keyOf(p, o)); logT(o, 'Linked: ' + REL[INV[rel]] + ' ' + keyOf(p, t));
}
function removeLink(p, t, l) {
  const o = taskOf(p, l.to);
  t.links = t.links.filter(x => x !== l); if (o) o.links = o.links.filter(x => !(x.to === t.id && x.rel === INV[l.rel]));
  logT(t, 'Link removed' + (o ? ': ' + keyOf(p, o) : ''));
}
