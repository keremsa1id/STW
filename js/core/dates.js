/* js/core/dates.js: Date and time helpers */

const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const today = () => iso(new Date());
const fmt = s => new Date(s + 'T00:00').toLocaleDateString('en-US', {day: 'numeric', month: 'short'});
const nowIso = () => new Date().toISOString();
const dn = s => Math.round(Date.parse(s + 'T00:00:00Z') / 864e5);          // 'YYYY-MM-DD' -> day number
const fromDn = n => new Date(n * 864e5);
const fmtDn = (n, o) => fromDn(n).toLocaleDateString('en-US', Object.assign({timeZone: 'UTC'}, o || {day: 'numeric', month: 'short'}));
const fmtDTY = s => s ? new Date(s).toLocaleString('en-US', {month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'}) : '';   // with the year (audit log)
const fmtDT = s => s ? new Date(s).toLocaleString('en-US', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'}) : '';
const hrs = h => (Math.round((h || 0) * 100) / 100) + 'h';
