/* js/core/state.js: Current screen state and filters */

let view = 'home', mode = 'list', ptab = 'items', showArch = false;
const flt = {pri: '', tag: '', who: '', st: ''};
const pass = t => (!flt.pri || t.pri === flt.pri) && (!flt.tag || (t.tags || []).includes(flt.tag)) && (!flt.who || t.who === flt.who) && (!flt.st || colOf(t) === flt.st);
const collapse = p => p.phases.forEach(ph => { ph.open = false; ph.subs.forEach(sb => sb.open = false); });
