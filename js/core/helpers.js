/* js/core/helpers.js: Lookups and small helpers shared by several screens */

const keyOf = (p, t) => prefix(p) + '-' + t.num;
const findProj = t => db.projects.find(pr => allTasks(pr).some(x => x.t === t));
const me = () => (db.me || '').trim();
const isMine = t => me() && (t.who || '').trim().toLowerCase() === me().toLowerCase();
const taskOf = (p, id) => { const x = allTasks(p).find(y => y.t.id === id); return x && x.t; };
const sprintName = (p, id) => (p.sprints.find(s => s.id === id) || {}).name || '';
const openSprints = (p, keep) => p.sprints.filter(s => s.state !== 'closed' || s.id === keep);
const removeTasks = (p, set) => p.phases.forEach(ph => ph.subs.forEach(sb => { sb.tasks = sb.tasks.filter(t => !set.has(t)); }));
