/* js/cloud/audit.js: Audit log: compares two project versions and lists what changed */

// Compares the last synced project with the one being saved and returns audit entries [action, target, detail] for epics, stories and tasks.
function auditDiff(pname, oldJ, newJ) {
  let o, n; try { o = JSON.parse(oldJ); n = JSON.parse(newJ); } catch (e) { return []; }
  const flat = x => {
    const e = {}, s = {}, t = {};
    (x.phases || []).forEach(ph => { e[ph.id] = {name: ph.name, color: ph.color || ''}; (ph.subs || []).forEach(sb => { s[sb.id] = {name: sb.name, ph: ph.id}; (sb.tasks || []).forEach(tk => { t[tk.id] = Object.assign({}, tk, {__s: sb.id, __ph: ph.id}); }); }); });
    return {e, s, t};
  };
  const a = flat(o), b = flat(n), out = [], pre = '[' + pname + '] ';
  const add = (act, target, detail) => out.push([act, target, pre + detail]);
  const lbl = k => String(COLS[k] || k || 'None');
  const where = (x, F) => (F.e[x.__ph] ? F.e[x.__ph].name : '?') + ' / ' + (F.s[x.__s] ? F.s[x.__s].name : '?');
  if (o.name !== n.name) add('project.edit', n.name, 'renamed "' + o.name + '"');
  if (!!o.archived !== !!n.archived) add('project.edit', n.name, n.archived ? 'archived' : 'restored from archive');
  for (const id in b.e) {
    if (!a.e[id]) add('epic.add', b.e[id].name, 'epic created');
    else { if (a.e[id].name !== b.e[id].name) add('epic.edit', b.e[id].name, 'renamed from "' + a.e[id].name + '"'); if (a.e[id].color !== b.e[id].color) add('epic.edit', b.e[id].name, 'colour changed'); }
  }
  for (const id in a.e) if (!b.e[id]) add('epic.delete', a.e[id].name, 'epic deleted');
  for (const id in b.s) {
    if (!a.s[id]) add('story.add', b.s[id].name, 'story created');
    else if (a.s[id].name !== b.s[id].name) add('story.edit', b.s[id].name, 'renamed from "' + a.s[id].name + '"');
  }
  for (const id in a.s) if (!b.s[id] && b.e[a.s[id].ph]) add('story.delete', a.s[id].name, 'story deleted');
  for (const id in b.t) if (!a.t[id]) add('task.create', b.t[id].t, 'created in ' + where(b.t[id], b));
  for (const id in a.t) if (!b.t[id] && b.s[a.t[id].__s]) add('task.delete', a.t[id].t, 'deleted from ' + where(a.t[id], a));
  for (const id in b.t) {
    const x = a.t[id], y = b.t[id]; if (!x) continue;
    const ch = [];
    if (x.t !== y.t) ch.push('title "' + x.t + '" → "' + y.t + '"');
    if (x.st !== y.st) ch.push('status ' + lbl(x.st) + ' → ' + lbl(y.st));
    if (x.__s !== y.__s) ch.push('moved ' + where(x, a) + ' → ' + where(y, b));
    if ((x.who || '') !== (y.who || '')) ch.push('assignee ' + (x.who || 'None') + ' → ' + (y.who || 'None'));
    if ((x.pri || '') !== (y.pri || '')) ch.push('priority ' + (x.pri || 'None') + ' → ' + (y.pri || 'None'));
    if ((x.due || '') !== (y.due || '')) ch.push('due ' + (x.due || 'None') + ' → ' + (y.due || 'None'));
    if ((x.sprint || '') !== (y.sprint || '')) ch.push('sprint changed');
    if ((x.color || '') !== (y.color || '')) ch.push('colour changed');
    if (ch.length) add(x.st !== y.st || x.__s !== y.__s ? 'task.move' : 'task.edit', y.t, ch.join('; '));
  }
  if (out.length > 25) { const rest = out.length - 24; out.length = 24; add('project.bulk', pname, rest + ' more changes in this save'); }
  return out;
}
