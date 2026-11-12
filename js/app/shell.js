/* js/app/shell.js: Sidebar and top bar */

function renderSidebar() {
  const sb = $('#sbar'); sb.replaceChildren();
  const nv = (txt, on, fn) => el('button', {className: 'nv' + (on ? ' on' : ''), textContent: txt, on: {click: fn}});
  const na = db.projects.filter(p => p.archived).length;
  sb.append(el('div', {className: 'brand'}, el('img', {className: 'logo', src: 'logo.svg?v=3', alt: 'Project Tracker'}), el('b', {textContent: 'Project Tracker'})),
    el('button', {className: 'pri newb', textContent: '+ Create project', on: {click: newProject}}),
    el('button', {className: 'nv', on: {click: searchDlg}}, el('span', {className: 'pn', textContent: '🔍 Search'}), el('kbd', {textContent: 'Ctrl K'})),
    nv('🏠 Dashboard', view === 'home' && !showArch, () => { showArch = false; view = 'home'; render(); }),
    nv('⭐ For you', view === 'me', () => { view = 'me'; render(); }),
    na ? nv('📦 Archive (' + na + ')', view === 'home' && showArch, () => { showArch = true; view = 'home'; render(); }) : '',
    nv('👥 Members & Roles', view === 'roles', () => { view = 'roles'; render(); }),
    el('div', {className: 'sec', textContent: 'Projects'}));
  db.projects.forEach(p => {
    if (p.archived) return;
    sb.append(el('button', {className: 'nv' + (view === 'project' && cur() === p ? ' on' : ''), title: p.name, on: {click: () => { showArch = false; open(p.id); }}},
      avatar(p), el('span', {className: 'pn', textContent: p.name}), p.cloudId ? el('small', {className: 'cl', title: 'Synced to the cloud', textContent: '☁'}) : '', el('small', {textContent: projStat(p).pct + '%'})));
  });
  sb.append(el('div', {className: 'grow'}),
    'Notification' in window && Notification.permission === 'granted' ? '' : nv('🔔 Enable notifications', false, askNotify),
    nv('⬆ Import', false, importProject),
    accountBtn());
}
// Theme switch: one icon button at the right end of the top bar, cycles auto, light, dark
function themeBtn() {
  const L = {auto: '🌓', light: '☀', dark: '🌙'}, th = db.theme || 'auto';
  return el('button', {className: 'theme-btn', textContent: L[th], title: 'Theme: ' + th + ' (click to change)', on: {click: () => { const o = ['auto', 'light', 'dark']; db.theme = o[(o.indexOf(th) + 1) % 3]; applyTheme(); save(); render(); }}});
}
function renderHeader() {
  const top = $('#top'); top.replaceChildren();
  top.append(el('button', {className: 'burger', textContent: '☰', title: 'Menu', on: {click: () => document.body.classList.toggle('nav')}}));
  if (view === 'home') {
    top.append(el('h1', {textContent: showArch ? 'Archive' : 'Dashboard'}), el('span', {className: 'sp'}),
      showArch ? el('button', {textContent: '← Projects', on: {click: () => { showArch = false; render(); }}}) : el('button', {className: 'pri', textContent: '+ Create project', on: {click: newProject}}));
  } else if (view === 'me') {
    top.append(el('h1', {textContent: 'For you'}));
  } else if (view === 'task' && taskCtx) {
    const tp = taskCtx.p, tt = taskCtx.t;
    top.append(el('button', {className: 'crumb', textContent: 'Projects', on: {click: () => { taskCtx = null; view = 'home'; render(); }}}), el('span', {className: 'sep', textContent: '/'}),
      el('button', {className: 'crumb', textContent: tp.name, on: {click: () => { taskCtx = null; view = 'project'; ptab = 'items'; render(); }}}), el('span', {className: 'sep', textContent: '/'}),
      el('h1', {textContent: keyOf(tp, tt)}), el('span', {className: 'sp'}), el('button', {textContent: 'Delete', on: {click: deleteOpenTask}}));
  } else if (view === 'roles') {
    top.append(el('h1', {textContent: 'Members & Roles'}), el('span', {className: 'sp'}),
      el('button', {className: 'pri', textContent: '+ Invite user', on: {click: inviteUserDlg}}));
  } else {
    const p = cur(), s = projStat(p);
    top.append(el('button', {className: 'crumb', textContent: 'Projects', on: {click: home}}), el('span', {className: 'sep', textContent: '/'}),
      avatar(p), el('h1', {textContent: p.name}), ic('✎', 'Rename project', () => rename(p, 'name', 'Project name')), el('span', {className: 'sp'}),
      el('div', {className: 'mini'}, el('span', {textContent: s.pct + '% · ' + s.d + '/' + plural(s.n, 'task')}), bar(s.pct)),
      ...(ptab === 'items' ? [viewSwitch(), filterBar(p)] : []),
      el('button', {className: 'mbtn', textContent: '👥 Members', on: {click: () => membersDlg(p)}}),
      el('button', {textContent: 'Export', on: {click: exportProject}}));
  }
  top.append(themeBtn());
}
