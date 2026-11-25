'use strict';
/* =====================================================================
   EduVerse — JavaScript (SPA). Prinsip gas-instant-ux:
   1) Semua layar ada di Index.html -> navigasi = tampil/sembunyi (0ms), URL tidak pernah berubah.
   2) Optimistic UI + localStorage (jawaban, sesi, snapshot data) + sinkron latar belakang.
   3) Data master dimuat 1x lewat bootstrap, dirender lokal; cache server di Kode.gs.
   4) Semua penulisan batch: 1 panggilan = banyak data.
   ===================================================================== */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } }
};
const fmtDT = ms => ms ? new Date(ms).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';
const fmtTm = ms => new Date(ms).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');
const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : String(m).padStart(2, '0')) + ':' + String(x).padStart(2, '0'); };
const relDay = ms => { if (!ms) return '-'; const d = Math.floor((Date.now() - ms) / 864e5); return d <= 0 ? 'Hari ini' : d === 1 ? 'Kemarin' : d + ' hari lalu'; };
const num = (v, d) => Number(v).toLocaleString('id-ID', { maximumFractionDigits: d == null ? 1 : d });
const toLocalInput = ms => { if (!ms) return ''; const d = new Date(ms - new Date(ms).getTimezoneOffset() * 6e4); return d.toISOString().slice(0, 16); };
const fromLocalInput = v => v ? new Date(v).getTime() : 0;

const App = { role: null, token: null, user: null, view: null, offset: 0, device: store.get('ev_dev', null) };
if (!App.device) { App.device = 'd' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); store.set('ev_dev', App.device); }

/* ---------- Pemuat skrip malas (Three.js, Chart.js, SheetJS) ---------- */
const _ls = {};
function loadScript(src) {
  if (_ls[src]) return _ls[src];
  return _ls[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = () => { delete _ls[src]; rej(new Error('Gagal memuat ' + src)); }; document.head.appendChild(s); });
}
const LIB = {
  three: () => loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'),
  chart: () => loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js'),
  xlsx: () => loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js')
};

/* ---------- Klien REST ke Google Apps Script (fetch) ----------
   POST text/plain  -> tidak memicu CORS preflight (aturan wajib GAS).
   Respons selalu JSON {success, data, message, code}. */
const CFG = window.EDUVERSE_CONFIG || {};
const gasReady = () => !!CFG.GAS_URL && !/XXXX|ISI_URL/i.test(CFG.GAS_URL) && /\/exec$/.test(CFG.GAS_URL);
async function api(fn, ...args) {
  if (!gasReady()) { const e = new Error('Backend belum terhubung: isi GAS_URL di js/config.js lalu push ulang.'); e.code = 'CONFIG'; throw e; }
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), CFG.TIMEOUT_MS || 30000);
  let text;
  try {
    const res = await fetch(CFG.GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: fn, args }), signal: ctl.signal, redirect: 'follow' });
    text = await res.text();
  } catch (err) { const e = new Error(err && err.name === 'AbortError' ? 'Server terlalu lama merespons.' : 'Tidak bisa terhubung ke server.'); e.net = true; throw e; }
  finally { clearTimeout(tm); }
  let r; try { r = JSON.parse(text); } catch (_) { const e = new Error('Respons server tidak valid. Pastikan Web App di-deploy: Execute as "Me", akses "Anyone", dan GAS_URL berakhiran /exec.'); e.net = true; e.code = 'BAD_RESPONSE'; throw e; }
  if (r && r.success) return r.data;
  const e = new Error((r && r.message) || 'Terjadi kesalahan.'); e.code = r && r.code; if (e.code === 'SESI') onSessionExpired(); throw e;
}
const apiT = (fn, ...a) => api(fn, App.token, ...a);

/* ---------- Toast ---------- */
function toast(msg, type, ms) {
  const el = document.createElement('div'); el.className = 'toast ' + (type || 'in'); el.setAttribute('role', 'status');
  const ic = { ok: 'check_circle', er: 'error', wa: 'warning', in: 'info' }[type || 'in'];
  el.innerHTML = '<span class="material-symbols-outlined fill" style="font-size:20px">' + ic + '</span><span>' + esc(msg) + '</span>';
  $('#toasts').appendChild(el); setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, ms || 3200);
  const all = $$('.toast', $('#toasts')); if (all.length > 3) all[0].remove();
}
window.addEventListener('online', () => { $('#netbar').style.display = 'none'; toast('Kembali online', 'ok'); document.dispatchEvent(new Event('ev:online')); });
window.addEventListener('offline', () => { $('#netbar').style.display = 'block'; });

/* ---------- Avatar voxel (SVG, tanpa gambar eksternal) ---------- */
const AVATARS = [
  { n: 'Astronot Cilik', skin: '#f1c27d', hair: '#3b2a1a', shirt: '#f2f4ff', pants: '#4da6ff', acc: 'helm', c: '#7cddff' },
  { n: 'Robo Pintar', skin: '#9fb7c9', hair: '#5b7a99', shirt: '#4da6ff', pants: '#32305b', acc: 'antena', c: '#ff8c42' },
  { n: 'Kucing Jenaka', skin: '#f4a259', hair: '#d9822b', shirt: '#ffeac2', pants: '#8a5a2b', acc: 'telinga', c: '#f4a259' },
  { n: 'Penyihir Muda', skin: '#f1c27d', hair: '#6b4bb8', shirt: '#4b2fa3', pants: '#2a1a6a', acc: 'topi', c: '#9b6bff' },
  { n: 'Dino Ceria', skin: '#6cc24a', hair: '#4aa02c', shirt: '#ffd43b', pants: '#3e7d2a', acc: 'duri', c: '#ff8c42' },
  { n: 'Ninja Gesit', skin: '#f1c27d', hair: '#111111', shirt: '#2a2760', pants: '#111111', acc: 'ikat', c: '#e5393a' },
  { n: 'Penjelajah', skin: '#e0ac69', hair: '#4a2c14', shirt: '#ffc83d', pants: '#5c4033', acc: 'syal', c: '#e5393a' },
  { n: 'Rubah Lincah', skin: '#ff8c42', hair: '#e56a1e', shirt: '#fff3e0', pants: '#b8531a', acc: 'ekor', c: '#ff8c42' }
];
const _avc = {};
function avatarSVG(i, size, bg) {
  const key = i + '|' + size + '|' + (bg || ''); if (_avc[key]) return _avc[key];
  const a = AVATARS[(i | 0) % 8] || AVATARS[0], R = (x, y, w, h, c, o) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c + '"' + (o ? ' opacity="' + o + '"' : '') + '/>';
  let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -3 12 19" width="' + size + '" height="' + Math.round(size * 19 / 12) + '" shape-rendering="crispEdges" aria-hidden="true">';
  if (bg) s += R(0, -3, 12, 19, bg);
  s += R(3, 12, 2, 3, a.pants) + R(7, 12, 2, 3, a.pants) + R(3, 15, 2, 1, '#1b1b2f') + R(7, 15, 2, 1, '#1b1b2f');
  if (a.acc === 'ekor') s += R(9, 10, 3, 2, a.c) + R(11, 9, 1, 1, '#fff');
  s += R(1, 7, 2, 4, a.skin) + R(9, 7, 2, 4, a.skin) + R(3, 7, 6, 5, a.shirt);
  s += R(3, 2, 6, 5, a.skin) + R(3, 1, 6, 2, a.hair) + R(4, 4, 1, 1, '#1b1b2f') + R(7, 4, 1, 1, '#1b1b2f') + R(5, 6, 2, 1, '#c0553b');
  if (a.acc === 'helm') s += R(2, 0, 8, 7, a.c, .32) + R(2, 0, 8, 1, '#fff', .7);
  else if (a.acc === 'antena') s += R(5, -1, 2, 2, a.c) + R(5, -3, 2, 1, '#f2f4ff');
  else if (a.acc === 'telinga') s += R(3, -1, 2, 2, a.c) + R(7, -1, 2, 2, a.c);
  else if (a.acc === 'topi') s += R(1, 1, 10, 1, a.c) + R(3, -1, 6, 2, a.c) + R(4, -3, 4, 2, a.c);
  else if (a.acc === 'duri') s += R(4, 0, 1, 1, a.c) + R(6, 0, 1, 1, a.c) + R(5, -1, 1, 1, a.c);
  else if (a.acc === 'ikat') s += R(3, 3, 6, 1, a.c) + R(9, 3, 2, 1, a.c);
  else if (a.acc === 'syal') s += R(3, 7, 6, 1, a.c) + R(8, 8, 1, 3, a.c);
  return _avc[key] = s + '</svg>';
}

/* ---------- Peta kota (dipakai dunia 3D, minimap siswa, radar guru, editor misi) ---------- */
const MAP_SLOTS = [
  { id: 'perpustakaan', nama: 'Perpustakaan', x: -16, z: -5.2 }, { id: 'sekolah', nama: 'Sekolah', x: 16, z: -5.2 },
  { id: 'toko_pizza', nama: 'Toko Pizza', x: -16, z: 5.2 }, { id: 'menara_jam', nama: 'Menara Jam', x: 16, z: 5.2 },
  { id: 'balai_kota', nama: 'Balai Kota', x: 0, z: -27 }, { id: 'taman', nama: 'Taman Kota', x: 0, z: 20 },
  { id: 'lab_ipa', nama: 'Lab IPA', x: -27, z: 0 }, { id: 'stadion', nama: 'Stadion', x: 27, z: 0 }
];
const SLOT = Object.fromEntries(MAP_SLOTS.map(s => [s.id, s]));
function drawCityMap(cv, dots, pins) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth || 300, h = cv.clientHeight || 300;
  if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
  const R = 40, sx = x => (x + R) / (2 * R) * w, sz = z => (z + R) / (2 * R) * h;
  c.fillStyle = '#16301f'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#3a3d4a'; c.fillRect(sx(-4), sz(-30), sx(4) - sx(-4), sz(22) - sz(-30)); c.fillRect(sx(-30), sz(-4), sx(30) - sx(-30), sz(4) - sz(-4));
  c.fillStyle = '#22283a'; [[-16, -12, 10, 8], [16, -12, 14, 8], [-16, 12, 8, 7], [16, 12, 6, 6], [0, -34, 16, 6], [-34, 0, 6, 12], [34, 0, 6, 14]].forEach(b => c.fillRect(sx(b[0] - b[2] / 2), sz(b[1] - b[3] / 2), sx(b[2]) - sx(0), sz(b[3]) - sz(0)));
  c.font = '600 10px Poppins,sans-serif'; c.textAlign = 'center';
  (pins || MAP_SLOTS.map(s => ({ x: s.x, z: s.z, label: s.nama, color: '#ffc83d' }))).forEach(p => {
    c.beginPath(); c.arc(sx(p.x), sz(p.z), p.r || 6, 0, 7); c.fillStyle = p.color || '#ffc83d'; c.fill(); c.lineWidth = 2; c.strokeStyle = 'rgba(0,0,0,.5)'; c.stroke();
    if (p.label) { c.fillStyle = '#e3dfff'; c.fillText(p.label, sx(p.x), sz(p.z) - 10); }
  });
  (dots || []).forEach(d => { c.beginPath(); c.arc(sx(d.x), sz(d.z), d.r || 5, 0, 7); c.fillStyle = d.color || '#7cddff'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#fff'; c.stroke(); if (d.label) { c.fillStyle = '#fff'; c.fillText(d.label, sx(d.x), sz(d.z) + 16); } });
  cv._map = { R, w, h };
}

/* ---------- Router: semua layar sudah ada di DOM -> 0ms ---------- */
const SVIEWS = ['v-landing', 'v-join', 'v-world', 'v-ranks', 'v-profile', 'v-ujian'];
function showView(id) {
  $$('.sv').forEach(v => v.classList.toggle('on', v.id === id));
  App.view = id; document.body.classList.remove('teacher');
  $$('[data-nav]').forEach(n => { n.innerHTML = [['v-world', 'public', 'Dunia'], ['v-ranks', 'leaderboard', 'Peringkat'], ['v-profile', 'school', 'Profil']].map(x => '<button type="button" data-go="' + x[0] + '" class="' + (x[0] === id ? 'on' : '') + '"><span class="material-symbols-outlined">' + x[1] + '</span>' + x[2] + '</button>').join(''); });
  document.dispatchEvent(new CustomEvent('ev:view', { detail: id }));
}
document.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) goStudent(b.dataset.go); });
function goStudent(id) { if (id === 'v-ranks') Stu.openRanks(); else if (id === 'v-profile') Stu.openProfile(); else showView(id); }

/* ---------- Sheet (siswa) ---------- */
let _sheetClose = null;
function openSheet(html, onClose) { $('#sheet').innerHTML = html; $('#ov').classList.add('on'); _sheetClose = onClose || null; }
function closeSheet() { $('#ov').classList.remove('on'); const f = _sheetClose; _sheetClose = null; if (f) f(); }
$('#ov').addEventListener('click', e => { if (e.target.id === 'ov' && !$('#ov').dataset.lock) closeSheet(); });

/* ---------- Sesi ---------- */
function saveSession(role, token, user, boot) { App.role = role; App.token = token; App.user = user; store.set('ev_sess', { role, token }); if (boot) store.set('ev_boot_' + role, boot); }
function clearSession() { store.del('ev_sess'); store.del('ev_boot_siswa'); store.del('ev_boot_guru'); store.del('ev_boot_admin'); App.token = null; App.role = null; App.user = null; }
function onSessionExpired() {
  if (!App.token) return; toast('Sesi berakhir, silakan masuk kembali.', 'wa'); const r = App.role; clearSession(); Stu.stop(); Tch.stop();
  if (r === 'siswa') showView('v-landing'); else { $('#tapp').classList.remove('on'); $('#tlogin').classList.add('on'); }
}
function logout() {
  const t = App.token; if (t) api('apiLogout', t).catch(() => { }); clearSession(); Stu.stop(); Tch.stop();
  $('#tapp').classList.remove('on'); $('#tlogin').classList.remove('on'); $('#ov').classList.remove('on'); showView('v-landing');
}

/* ---------- Ilustrasi hero landing (SVG, tanpa gambar eksternal) ---------- */
function heroSVG() {
  let r = 7; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280, W = 480, H = 270;
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Kota voxel malam hari dengan murid berlari bersama"><defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1250"/><stop offset="1" stop-color="#5b3a8c"/></linearGradient></defs><rect width="' + W + '" height="' + H + '" fill="url(#hg)"/>';
  for (let i = 0; i < 34; i++) s += '<rect x="' + (rnd() * W | 0) + '" y="' + (rnd() * 90 | 0) + '" width="2" height="2" fill="#fff" opacity="' + (.3 + rnd() * .6).toFixed(2) + '"/>';
  s += '<circle cx="410" cy="42" r="16" fill="#fff6c8"/><circle cx="416" cy="38" r="14" fill="#1a1250" opacity=".35"/>';
  const cols = ['#3a2c6e', '#4b3a86', '#2f2a66', '#6b3b4e', '#8a4a3a'];
  for (let x = 0; x < W; x += 46) { const h = 70 + rnd() * 90 | 0, c = cols[rnd() * 5 | 0]; s += '<rect x="' + x + '" y="' + (190 - h) + '" width="44" height="' + h + '" fill="' + c + '"/>'; for (let y = 190 - h + 8; y < 182; y += 14) for (let wx = x + 6; wx < x + 40; wx += 12) s += '<rect x="' + wx + '" y="' + y + '" width="6" height="8" fill="' + (rnd() > .35 ? '#ffd86b' : '#2a2058') + '"/>'; }
  s += '<rect y="190" width="' + W + '" height="80" fill="#3b3454"/><rect y="190" width="' + W + '" height="8" fill="#7d6f9e"/>';
  for (let x = 6; x < W; x += 52) s += '<rect x="' + x + '" y="246" width="28" height="4" fill="#c9bfe6" opacity=".55"/>';
  [[70, 'Leo', 0], [150, 'Mia', 2], [230, 'Sam', 1], [310, 'Chloe', 3], [390, 'Ben', 6]].forEach((p, i) => {
    const y = 176 + (i % 2) * 14; s += '<g transform="translate(' + p[0] + ' ' + y + ')"><rect x="-22" y="-34" width="44" height="17" rx="6" fill="#fff" opacity=".92"/><text x="0" y="-22" font-size="10" font-weight="700" font-family="Poppins,sans-serif" text-anchor="middle" fill="#1c1a45">' + p[1] + '</text><svg x="-20" y="-14" width="40" height="63" viewBox="0 -3 12 19" shape-rendering="crispEdges">' + avatarSVG(p[2], 12).replace(/^<svg[^>]*>/, '').replace('</svg>', '') + '</svg></g>';
  });
  return s + '</svg><div class="tagc"><span class="material-symbols-outlined fill" style="font-size:16px">groups</span>30+ murid sekaligus</div>';
}
