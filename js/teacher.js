
/* =====================================================================
   DASHBOARD GURU (bagian A): shell, dashboard, kelas, bank soal, asesmen, misi
   Semua data dari 1x bootstrap -> render lokal instan. Edit = optimistic + rollback.
   ===================================================================== */
const TS = { b: null, kelas: '', view: 'dashboard', pg: {}, q: {}, live: null, liveT: 0, liveOn: false, liveAt: 0, asesmen: '', charts: {}, mode: 'grid', bg: 0, cm: {}, sm: {}, am: {}, bm: {} };
const TX = {};
const NAV = [['dashboard', 'space_dashboard', 'Dashboard'], ['kelas', 'groups', 'Manajemen Kelas'], ['bank', 'folder_open', 'Bank Soal'], ['asesmen', 'assignment', 'Desain Asesmen'], ['misi', 'map', 'Editor Misi 3D'], ['cctv', 'videocam', 'CCTV Live'], ['integritas', 'shield', 'Laporan Integritas'], ['rekap', 'grade', 'Rekap Nilai'], ['sertifikat', 'workspace_premium', 'Sertifikat'], ['admin', 'admin_panel_settings', 'Admin Panel']];
const ico = (n, s) => '<span class="material-symbols-outlined"' + (s ? ' style="font-size:' + s + 'px"' : '') + '>' + n + '</span>';
const chipT = (t, c) => '<span class="chipT ' + (c || '') + '">' + esc(t) + '</span>';
const LISTKEY = { Kelas: 'classes', BankSoal: 'bank', Asesmen: 'asesmen', Misi: 'misi' };
const genId = p => p + '-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
const val = id => { const e = $('#' + id); return e ? e.value : ''; };
const SKIN = (v, d) => v == null || v === '' ? d : v;
const T = {}; // renderer per tampilan

function idx() { const b = TS.b; TS.cm = {}; TS.sm = {}; TS.am = {}; TS.bm = {}; b.classes.forEach(x => TS.cm[x.ID] = x); b.students.forEach(x => TS.sm[x.id] = x); b.asesmen.forEach(x => TS.am[x.ID] = x); b.bank.forEach(x => TS.bm[x.ID] = x); }
const myClassIds = () => TS.kelas ? [TS.kelas] : TS.b.classes.map(c => c.ID);
const clsAsesmen = () => TS.b.asesmen.filter(a => !TS.kelas || a.IDKelas === TS.kelas);
const clsStudents = () => TS.b.students.filter(s => !TS.kelas || s.kelas === TS.kelas);
const nilaiOf = aid => TS.b.nilai.filter(n => n.IDAsesmen === aid);
const jenisChip = j => chipT(j, j === 'STS' ? 'bl' : j === 'SAS' ? 'wa' : '');
const stChip = s => chipT(s, { Aktif: 'ok', Draft: '', Jeda: 'wa', Selesai: 'bl' }[s] || '');
const riskCls = r => ({ Rendah: 'ok', Sedang: 'wa', Tinggi: 'er', Kritis: 'er' }[r] || '');
const avs = (i, s) => '<span class="avs" style="width:' + s + 'px;height:' + s + 'px">' + avatarSVG(i, Math.round(s * .75), '#EFF4FF') + '</span>';
function riskOf(integ) { return integ >= 90 ? ['Aman', 'ok'] : integ >= 70 ? ['Perhatian', 'wa'] : ['Pelanggaran', 'er']; }
function scoreCls(n, kkm) { return n >= kkm + 10 ? '' : n >= kkm ? 'mid' : 'low'; }

/* ---------- Modal, form & tabel generik ---------- */
function mOpen(title, body, foot, lg) {
  $('#mdl').className = 'mdl' + (lg ? ' lg' : ''); $('#mdl').innerHTML = '<header><h3>' + title + '</h3><button class="tb ic" onclick="mClose()" aria-label="Tutup">' + ico('close') + '</button></header><div class="bd2">' + body + '</div>' + (foot ? '<footer>' + foot + '</footer>' : '');
  $('#mov').classList.add('on'); const f = $('input,select,textarea', $('#mdl .bd2')); if (f && !('ontouchstart' in window)) setTimeout(() => f.focus(), 40);
}
function mClose() { $('#mov').classList.remove('on'); $('#mdl').innerHTML = ''; }
$('#mov').addEventListener('mousedown', e => { if (e.target.id === 'mov') mClose(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#mov').classList.contains('on')) mClose(); });
const fld = (label, inner, id) => '<div class="fld"><label' + (id ? ' for="' + id + '"' : '') + '>' + label + '</label>' + inner + '</div>';
const inp = (id, v, a) => '<input class="tin" id="' + id + '" value="' + esc(v == null ? '' : v) + '" ' + (a || '') + '>';
const sel = (id, opts, v, a) => '<select class="tsl" id="' + id + '" ' + (a || '') + '>' + opts.map(o => { const x = Array.isArray(o) ? o : [o, o]; return '<option value="' + esc(x[0]) + '"' + (String(x[0]) === String(v) ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select>';
const pgOf = id => TS.pg[id] || 1;
function pager(id, total, per) {
  const pages = Math.max(1, Math.ceil(total / per)), p = Math.min(pgOf(id), pages), s = (p - 1) * per;
  let btn = ''; for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - p) <= 1) btn += '<button class="' + (i === p ? 'on' : '') + '" onclick="TX.pg(\'' + id + '\',' + i + ')">' + i + '</button>'; else if (Math.abs(i - p) === 2) btn += '<span>…</span>';
  return '<div class="pager"><span>Menampilkan ' + (total ? s + 1 : 0) + '–' + Math.min(total, s + per) + ' dari ' + total + '</span><div><button ' + (p <= 1 ? 'disabled' : '') + ' onclick="TX.pg(\'' + id + '\',' + (p - 1) + ')">' + ico('chevron_left', 18) + '</button>' + btn + '<button ' + (p >= pages ? 'disabled' : '') + ' onclick="TX.pg(\'' + id + '\',' + (p + 1) + ')">' + ico('chevron_right', 18) + '</button></div></div>';
}
const slice = (id, arr, per) => { const p = Math.min(pgOf(id), Math.max(1, Math.ceil(arr.length / per))); return arr.slice((p - 1) * per, p * per); };
TX.pg = (id, n) => { TS.pg[id] = n; render(); };
const empty = (icon, t) => '<div class="empty">' + ico(icon) + '<div style="margin-top:6px">' + t + '</div></div>';
const ph = (eb, title, sub, right) => '<div class="ph"><div><div class="eb">' + eb + '</div><h1>' + title + '</h1><p>' + sub + '</p></div><div class="row g8 wrap">' + (right || '') + '</div></div>';
async function mkChart(id, type, labels, data, opts) {
  try { await LIB.chart(); } catch (e) { const c = $('#' + id); if (c) c.parentElement.innerHTML = empty('cloud_off', 'Grafik butuh koneksi internet'); return; }
  const cv = $('#' + id); if (!cv) return; if (TS.charts[id]) TS.charts[id].destroy(); const cs = getComputedStyle(document.documentElement), mu = cs.getPropertyValue('--t-mu').trim(), bd = cs.getPropertyValue('--t-bd').trim();
  TS.charts[id] = new Chart(cv, { type, data: { labels, datasets: data }, options: Object.assign({ responsive: true, maintainAspectRatio: false, animation: { duration: 350 }, plugins: { legend: { display: data.length > 1, labels: { color: mu } } }, scales: { x: { ticks: { color: mu }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: mu }, grid: { color: bd } } } }, opts || {}) });
}

/* ---------- Simpan/hapus entitas: optimistic + rollback ---------- */
async function saveEnt(name, rec, isNew) {
  const lk = LISTKEY[name], list = TS.b[lk], i = list.findIndex(x => x.ID === rec.ID), prev = i >= 0 ? Object.assign({}, list[i]) : null;
  if (i >= 0) list[i] = Object.assign({}, list[i], rec); else list.unshift(rec); idx(); render();
  try { const s = await apiT('apiSave', name, rec); const j = list.findIndex(x => x.ID === rec.ID); if (j >= 0) list[j] = s; idx(); render(); persistBoot(); return s; }
  catch (e) { const j = list.findIndex(x => x.ID === rec.ID); if (prev) list[j] = prev; else if (j >= 0) list.splice(j, 1); idx(); render(); toast(e.message, 'er', 5000); throw e; }
}
async function delEnt(name, id) {
  const lk = LISTKEY[name], list = TS.b[lk], i = list.findIndex(x => x.ID === id); if (i < 0) return; const prev = list[i]; list.splice(i, 1); idx(); render();
  try { await apiT('apiDelete', name, id); if (name === 'Asesmen') TS.b.misi = TS.b.misi.filter(m => m.IDAsesmen !== id); persistBoot(); toast('Terhapus', 'ok', 1800); }
  catch (e) { list.splice(i, 0, prev); idx(); render(); toast(e.message, 'er', 5000); }
}
const persistBoot = debounce(() => { try { store.set('ev_boot_' + App.role, TS.b); } catch (e) { } }, 800);
function confirmDel(msg, fn) {
  mOpen('Konfirmasi', '<p style="margin:0">' + msg + '</p>', '<button class="tb" onclick="mClose()">Batal</button><button class="tb d" id="cfBtn">Ya, hapus</button>');
  $('#cfBtn').onclick = () => { mClose(); fn(); };
}

/* ---------- Shell & navigasi ---------- */
function render() { if (App.role === 'guru' || App.role === 'admin') { if (!TS.b) return; idx(); const f = T[TS.view]; if (f) f(); } }
function tGo(v) {
  if (v === 'admin' && App.role !== 'admin') v = 'dashboard'; if (TS.view === 'cctv' && v !== 'cctv') { liveStop(); exitCctvFs(); } TS.view = v; store.set('ev_tview', v);
  $$('.tsec').forEach(s => s.classList.toggle('on', s.id === 't-' + v)); $$('.ni', $('#tNav')).forEach(n => n.classList.toggle('on', n.dataset.v === v)); $('#tSide').classList.remove('open'); $('#tOvl').classList.remove('on'); $('#tPage').scrollTop = 0;
  render(); if (v === 'cctv') liveStart();
}
function tShell() {
  const adm = App.role === 'admin';
  $('#tNav').innerHTML = NAV.filter(n => n[0] !== 'admin' || adm).map(n => (n[0] === 'admin' ? '<hr>' : '') + '<button class="ni" data-v="' + n[0] + '" type="button">' + ico(n[1]) + '<span>' + n[2] + '</span>' + (n[0] === 'cctv' ? '<span class="live">LIVE</span>' : '') + '</button>').join('');
  const u = TS.b.user; $('#tUa').textContent = (u.nama || 'G')[0]; $('#tUn').textContent = u.nama; $('#tUr').textContent = adm ? 'Administrator' : 'Guru Wali Kelas'; $('#tBrand').textContent = (TS.b.cfg.appName || 'EduVerse').split(' ')[0];
  tKelasSel();
}
function tKelasSel() {
  const cl = TS.b.classes, s = $('#tKelas'); if (!cl.length) { s.innerHTML = '<option value="">(belum ada kelas)</option>'; TS.kelas = ''; return; }
  if (!cl.some(c => c.ID === TS.kelas)) TS.kelas = store.get('ev_tkelas', '') && cl.some(c => c.ID === store.get('ev_tkelas')) ? store.get('ev_tkelas') : cl[0].ID;
  s.innerHTML = cl.map(c => '<option value="' + esc(c.ID) + '"' + (c.ID === TS.kelas ? ' selected' : '') + '>' + esc(c.NamaKelas) + (c.Status === 'Aktif' ? ' (Aktif)' : ' (Selesai)') + '</option>').join('');
}
function tBind() {
  $('#tNav').addEventListener('click', e => { const b = e.target.closest('.ni'); if (b) tGo(b.dataset.v); });
  $('#tKelas').addEventListener('change', e => { TS.kelas = e.target.value; store.set('ev_tkelas', TS.kelas); TS.asesmen = ''; TS.pg = {}; if (TS.view === 'cctv') { liveStop(); liveStart(); } render(); });
  $('#tMenu').addEventListener('click', () => { $('#tSide').classList.add('open'); $('#tOvl').classList.add('on'); }); $('#tOvl').addEventListener('click', () => { $('#tSide').classList.remove('open'); $('#tOvl').classList.remove('on'); });
  $('#tOut').addEventListener('click', logout);
  $('#tTheme').addEventListener('click', () => { const d = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; setTheme(d); render(); });
  $('#tRefresh').addEventListener('click', () => Tch.reload(true));
  $('#tLoginForm').addEventListener('submit', async e => {
    e.preventDefault(); const er = $('#tErr'), b = $('#tGo'); er.textContent = ''; er.style.color = 'var(--t-er)'; b.disabled = true; b.innerHTML = '<span class="spin"></span>';
    try { const d = await api('apiLoginGuru', $('#tUser').value, $('#tPass').value); $('#tPass').value = ''; $('#tlogin').classList.remove('on'); Tch.enter(d); }
    catch (x) { er.textContent = x.message; } finally { b.disabled = false; b.textContent = 'Masuk'; }
  });
  $('#tBack').addEventListener('click', () => $('#tlogin').classList.remove('on'));
}
function setTheme(d) { document.documentElement.dataset.theme = d; store.set('ev_theme', d); $('#tTheme').innerHTML = ico(d === 'dark' ? 'light_mode' : 'dark_mode'); }
function setSync(ok, msg) { $('#tDot').style.background = ok ? '#16a34a' : '#DC2626'; $('#tSync').textContent = ok ? 'Tersinkron ' + fmtTm(Date.now()).slice(0, 5) : (msg || 'Offline'); }

/* ---------- Dashboard ---------- */
T.dashboard = function () {
  const as = clsAsesmen(), st = clsStudents(), ids = as.map(a => a.ID), nl = TS.b.nilai.filter(n => ids.includes(n.IDAsesmen) && n.Status !== 'Mengerjakan');
  const avg = nl.length ? nl.reduce((a, n) => a + n.NilaiAkhir, 0) / nl.length : 0, vio = nl.reduce((a, n) => a + n.Pelanggaran, 0), pend = nl.filter(n => n.Status === 'Perlu Dinilai').length;
  const act = as.filter(a => a.Status === 'Aktif').length, kk = TS.cm[TS.kelas] || {}, low = nl.filter(n => { const a = TS.am[n.IDAsesmen]; return a && n.NilaiAkhir < a.KKM; }).length, risky = nl.filter(n => n.Integritas < 70).length;
  const kpi = (l, v, n, ic, cls) => '<div class="tcard kpi ' + (cls || '') + '"><div class="kl"><span>' + l + '</span>' + ico(ic, 20) + '</div><div class="kv">' + v + '</div><div class="kn">' + n + '</div></div>';
  const ins = []; if (pend) ins.push('<b>' + pend + ' lembar uraian</b> menunggu penilaian Anda (menu Rekap Nilai).'); if (low) ins.push('<b>' + low + ' hasil</b> berada di bawah KKM — pertimbangkan remedial.'); if (risky) ins.push('<b>' + risky + ' peserta</b> memiliki skor integritas &lt; 70% — cek Laporan Integritas.'); if (!as.length) ins.push('Belum ada asesmen. Mulai dari menu <b>Bank Soal</b> lalu <b>Desain Asesmen</b>.'); if (!ins.length) ins.push('Semua berjalan baik. Tidak ada tindakan mendesak.');
  const rec = nl.slice().sort((a, b) => b.WaktuSelesai - a.WaktuSelesai).slice(0, 6);
  $('#t-dashboard').innerHTML = ph('Ringkasan', 'Dashboard Guru', 'Pantau kelas ' + esc(kk.NamaKelas || '-') + ' secara menyeluruh.', '<button class="tb a" onclick="tGo(\'cctv\')">' + ico('videocam') + 'Buka CCTV Live</button>') +
    '<div class="grid g4">' + kpi('Siswa', st.length, 'Terdaftar di kelas ini', 'groups') + kpi('Asesmen Aktif', act, as.length + ' asesmen total', 'assignment') + kpi('Rata-rata Nilai', nl.length ? num(avg) : '–', nl.length + ' hasil masuk', 'grade') + kpi('Pelanggaran', vio, 'Tercatat otomatis', 'shield', vio ? 'er' : '') + '</div>' +
    '<div class="grid g21" style="margin-top:16px"><div class="tcard"><h3>Rata-rata nilai per asesmen</h3><p class="sub">Dibandingkan dengan KKM</p><div class="cv"><canvas id="chAvg"></canvas></div></div><div class="tcard"><h3>Insight otomatis</h3><p class="sub">Ringkasan tindakan</p><div class="ins"><ul>' + ins.map(x => '<li>' + x + '</li>').join('') + '</ul></div></div></div>' +
    '<div class="grid g2" style="margin-top:16px"><div class="tcard"><h3>Sebaran nilai</h3><p class="sub">Semua asesmen selesai di kelas ini</p><div class="cv"><canvas id="chDist"></canvas></div></div><div class="tcard"><h3>Pelanggaran integritas per asesmen</h3><p class="sub">Jumlah kejadian</p><div class="cv"><canvas id="chVio"></canvas></div></div></div>' +
    '<div class="tcard" style="margin-top:16px"><h3>Hasil terbaru</h3><p class="sub">6 pengumpulan terakhir</p>' + (rec.length ? '<div class="twrap"><table class="tt"><thead><tr><th>Siswa</th><th>Asesmen</th><th class="num">Nilai</th><th>Status</th><th>Waktu</th></tr></thead><tbody>' + rec.map(n => { const s = TS.sm[n.IDSiswa] || {}, a = TS.am[n.IDAsesmen] || {}; return '<tr><td>' + avs(s.avatar || 0, 28) + ' <b>' + esc(s.nama || n.IDSiswa) + '</b></td><td>' + esc(a.Judul) + '</td><td class="num"><span class="sc ' + scoreCls(n.NilaiAkhir, a.KKM || 75) + '">' + num(n.NilaiAkhir, 0) + '</span></td><td>' + chipT(n.Status, n.Status === 'Selesai' ? 'ok' : 'wa') + '</td><td>' + fmtDT(n.WaktuSelesai) + '</td></tr>'; }).join('') + '</tbody></table></div>' : empty('inbox', 'Belum ada hasil masuk')) + '</div>';
  const withN = as.filter(a => nilaiOf(a.ID).some(n => n.Status !== 'Mengerjakan'));
  mkChart('chAvg', 'bar', withN.map(a => a.Judul.slice(0, 18)), [{ label: 'Rata-rata', data: withN.map(a => { const r = nilaiOf(a.ID).filter(n => n.Status !== 'Mengerjakan'); return +(r.reduce((x, n) => x + n.NilaiAkhir, 0) / r.length).toFixed(1); }), backgroundColor: '#2F80ED', borderRadius: 6 }, { label: 'KKM', type: 'line', data: withN.map(a => a.KKM), borderColor: '#FFC83D', borderWidth: 2, pointRadius: 0 }], { scales: { y: { beginAtZero: true, max: 100, ticks: { color: '#64748B' } }, x: { ticks: { color: '#64748B' }, grid: { display: false } } } });
  const bins = [0, 0, 0, 0, 0]; nl.forEach(n => bins[n.NilaiAkhir < 60 ? 0 : n.NilaiAkhir < 70 ? 1 : n.NilaiAkhir < 80 ? 2 : n.NilaiAkhir < 90 ? 3 : 4]++);
  mkChart('chDist', 'bar', ['<60', '60–69', '70–79', '80–89', '90–100'], [{ label: 'Siswa', data: bins, backgroundColor: ['#fca5a5', '#c9dbff', '#c9dbff', '#2F80ED', '#8ab4f8'], borderRadius: 6 }]);
  mkChart('chVio', 'bar', withN.map(a => a.Judul.slice(0, 18)), [{ label: 'Pelanggaran', data: withN.map(a => nilaiOf(a.ID).reduce((x, n) => x + n.Pelanggaran, 0)), backgroundColor: '#DC2626', borderRadius: 6 }]);
};

/* ---------- Manajemen kelas ---------- */
T.kelas = function () {
  const cl = TS.b.classes, cnt = id => TS.b.students.filter(s => s.kelas === id).length;
  $('#t-kelas').innerHTML = ph('Pengelolaan', 'Manajemen Kelas', 'Buat kelas, bagikan Kode Kelas, atur status aktif/selesai.', '<button class="tb p" onclick="TX.kelasForm()">' + ico('add') + 'Kelas Baru</button>') +
    (cl.length ? '<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">' + cl.map(c => '<div class="tcard cls-card"><div class="row between"><h3 style="font-size:17px">' + esc(c.NamaKelas) + '</h3>' + stChip(c.Status) + '</div><div style="color:var(--t-mu);font-size:13px">' + esc(c.Mapel || '-') + ' • ' + esc(c.Jenjang || '-') + ' • ' + cnt(c.ID) + ' siswa</div><div class="row g8"><span class="codebox">' + esc(c.KodeKelas) + '</span><button class="tb sm" onclick="TX.copy(\'' + esc(c.KodeKelas) + '\')">' + ico('content_copy', 16) + 'Salin</button></div><div class="row g8 wrap"><button class="tb sm" onclick="TX.kelasForm(\'' + c.ID + '\')">' + ico('edit', 16) + 'Edit</button><button class="tb sm" onclick="TX.kelasSiswa(\'' + c.ID + '\')">' + ico('groups', 16) + 'Siswa</button><button class="tb sm" onclick="TX.kelasToggle(\'' + c.ID + '\')">' + ico(c.Status === 'Aktif' ? 'check_circle' : 'play_circle', 16) + (c.Status === 'Aktif' ? 'Selesaikan' : 'Aktifkan') + '</button><button class="tb sm d" onclick="TX.kelasDel(\'' + c.ID + '\')">' + ico('delete', 16) + '</button></div></div>').join('') + '</div>' : empty('groups', 'Belum ada kelas. Klik “Kelas Baru”.'));
};
TX.copy = c => { (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(() => toast('Kode ' + c + ' disalin', 'ok', 1500)).catch(() => toast('Kode kelas: ' + c, 'in')); };
TX.kelasForm = id => {
  const c = id ? TS.cm[id] : { NamaKelas: '', Mapel: '', Jenjang: 'SMA/SMK', Status: 'Aktif' };
  mOpen(id ? 'Edit Kelas' : 'Kelas Baru', fld('Nama kelas', inp('fNama', c.NamaKelas, 'placeholder="Contoh: Kelas 10 - IPA 1" maxlength="60"'), 'fNama') + '<div class="frow">' + fld('Mata pelajaran', inp('fMapel', c.Mapel, 'maxlength="40"'), 'fMapel') + fld('Jenjang', sel('fJen', ['PAUD/TK', 'SD', 'SMP', 'SMA/SMK', 'Mahasiswa', 'Umum'], c.Jenjang), 'fJen') + fld('Status', sel('fSt', ['Aktif', 'Selesai'], c.Status), 'fSt') + '</div>' + (id ? '' : '<p style="color:var(--t-mu);font-size:13px;margin:0">Kode Kelas dibuat otomatis setelah disimpan.</p>'), '<button class="tb" onclick="mClose()">Batal</button><button class="tb p" onclick="TX.kelasSave(\'' + (id || '') + '\')">Simpan</button>');
};
TX.kelasSave = id => { const r = { ID: id || genId('KLS'), NamaKelas: val('fNama'), Mapel: val('fMapel'), Jenjang: val('fJen'), Status: val('fSt') }; if (id) r.KodeKelas = TS.cm[id].KodeKelas; if (r.NamaKelas.trim().length < 3) return toast('Nama kelas minimal 3 karakter', 'er'); mClose(); r.KodeKelas = r.KodeKelas || '…'; saveEnt('Kelas', r, !id).then(() => { tKelasSel(); toast('Kelas tersimpan', 'ok'); }).catch(() => { }); };
TX.kelasToggle = id => { const c = TS.cm[id]; saveEnt('Kelas', Object.assign({}, c, { Status: c.Status === 'Aktif' ? 'Selesai' : 'Aktif' })).then(() => tKelasSel()).catch(() => { }); };
TX.kelasDel = id => {
  const c = TS.cm[id]; if (!c) return;
  const ns = TS.b.students.filter(s => s.kelas === id).length, as = TS.b.asesmen.filter(a => a.IDKelas === id), aset = new Set(as.map(a => a.ID)), nn = TS.b.nilai.filter(n => aset.has(n.IDAsesmen)).length, has = ns + as.length > 0, mandiri = String(c.KodeKelas).toUpperCase() === 'MANDIRI';
  mOpen('Hapus kelas “' + esc(c.NamaKelas) + '”?', (has ? '<p style="margin:0 0 8px">Kelas ini masih berisi:</p><ul style="margin:0 0 10px;padding-left:20px"><li><b>' + ns + '</b> siswa</li><li><b>' + as.length + '</b> asesmen (beserta misi di peta)</li><li><b>' + nn + '</b> hasil ujian siswa</li></ul><div class="ins">Semuanya ikut <b>terhapus permanen</b> dan tidak bisa dibatalkan. Siswa yang sedang online langsung dikeluarkan. <b>Bank soal Anda tidak terhapus.</b></div>' : '<p style="margin:0">Kelas ini kosong dan akan dihapus.</p>') +
    (mandiri ? '<div class="ins" style="margin-top:10px;border-color:var(--t-er)"><b>Perhatian:</b> ini kelas sistem untuk tombol “Belajar Mandiri”. Setelah dihapus, tombol itu tidak berfungsi sampai Anda membuat kelas baru dengan kode <code>MANDIRI</code>.</div>' : '') +
    (has ? '<label style="display:flex;gap:8px;align-items:flex-start;margin-top:12px;font-size:13px;cursor:pointer"><input type="checkbox" id="kdOk" onchange="$(\'#kdYes\').disabled=!this.checked"> <span>Saya mengerti dan ingin menghapus kelas beserta seluruh isinya.</span></label>' : ''),
    '<button class="tb" onclick="mClose()">Batal</button><button class="tb d" id="kdYes"' + (has ? ' disabled' : '') + '>' + ico('delete', 18) + 'Hapus kelas</button>');
  $('#kdYes').onclick = async () => {
    mClose(); const b = TS.b, snap = { cl: b.classes.slice(), st: b.students.slice(), as: b.asesmen.slice(), ms: b.misi.slice(), nl: b.nilai.slice(), lg: b.logs.slice() };
    b.classes = b.classes.filter(x => x.ID !== id); b.students = b.students.filter(s => s.kelas !== id); b.asesmen = b.asesmen.filter(a => a.IDKelas !== id); b.misi = b.misi.filter(m => !aset.has(m.IDAsesmen)); b.nilai = b.nilai.filter(n => !aset.has(n.IDAsesmen)); b.logs = b.logs.filter(l => !aset.has(l.IDAsesmen));
    if (TS.kelas === id) { liveStop(); TS.asesmen = ''; } tKelasSel(); idx(); render(); toast('Menghapus kelas…', 'in', 1500);
    try { const r = await apiT('apiDeleteClass', id); persistBoot(); toast('Kelas “' + r.kelas + '” dihapus (' + r.siswa + ' siswa, ' + r.asesmen + ' asesmen)', 'ok', 4500); if (TS.view === 'cctv') liveStart(); }
    catch (e) { Object.assign(b, { classes: snap.cl, students: snap.st, asesmen: snap.as, misi: snap.ms, nilai: snap.nl, logs: snap.lg }); tKelasSel(); idx(); render(); toast(e.message, 'er', 6000); }
  };
};
/* ---------- Daftar siswa kelas: cari, pilih, hapus ---------- */
const SW = { id: '', q: '', sel: new Set() };
TX.kelasSiswa = id => {
  SW.id = id; SW.q = ''; SW.sel = new Set();
  mOpen('Siswa — ' + esc((TS.cm[id] || {}).NamaKelas), '<div class="tools"><input class="tin" id="swQ" placeholder="Cari nama atau NISN…" aria-label="Cari siswa"><label style="display:flex;gap:8px;align-items:center;font-size:13px;cursor:pointer"><input type="checkbox" id="swAll" onchange="TX.swAll(this.checked)"> Pilih semua yang tampak</label></div><div id="swList"></div>',
    '<span id="swCnt" style="margin-right:auto;font-size:13px;color:var(--t-mu)"></span><button class="tb" onclick="mClose()">Tutup</button><button class="tb d" id="swDel" onclick="TX.swDelSel()" disabled>' + ico('person_remove', 18) + 'Hapus terpilih</button>', true);
  $('#swQ').oninput = debounce(() => { SW.q = val('swQ').toLowerCase(); swRender(); }, 150); swRender();
};
function swRows() { return TS.b.students.filter(s => s.kelas === SW.id && (!SW.q || (s.nama + ' ' + (s.nisn || '')).toLowerCase().includes(SW.q))).sort((a, b) => b.poin - a.poin); }
function swRender() {
  const rows = swRows(), total = TS.b.students.filter(s => s.kelas === SW.id).length;
  $('#swList').innerHTML = rows.length ? '<div class="twrap" style="max-height:52vh;overflow:auto"><table class="tt"><thead><tr><th style="width:34px"></th><th>Siswa</th><th>NISN</th><th class="num">Level</th><th class="num">Poin</th><th></th></tr></thead><tbody>' + rows.map(s => '<tr><td><input type="checkbox" aria-label="Pilih ' + esc(s.nama) + '" ' + (SW.sel.has(s.id) ? 'checked ' : '') + 'onchange="TX.swPick(\'' + s.id + '\',this.checked)"></td><td>' + avs(s.avatar, 28) + ' ' + esc(s.nama) + '</td><td>' + esc(s.nisn || '-') + '</td><td class="num">' + s.level + '</td><td class="num">' + num(s.poin, 0) + '</td><td><button class="tb sm ic d" aria-label="Hapus ' + esc(s.nama) + '" onclick="TX.swDelete([\'' + s.id + '\'])">' + ico('delete', 16) + '</button></td></tr>').join('') + '</tbody></table></div>' : empty(total ? 'search_off' : 'person_off', total ? 'Tidak ada siswa yang cocok.' : 'Belum ada siswa. Bagikan kode kelas.');
  swCount();
}
function swCount() { const n = SW.sel.size, rows = swRows(), a = $('#swAll'); $('#swCnt').textContent = n ? n + ' dipilih' : TS.b.students.filter(s => s.kelas === SW.id).length + ' siswa'; $('#swDel').disabled = !n; if (a) a.checked = rows.length > 0 && rows.every(s => SW.sel.has(s.id)); }
TX.swPick = (id, on) => { on ? SW.sel.add(id) : SW.sel.delete(id); swCount(); };
TX.swAll = on => { swRows().forEach(s => on ? SW.sel.add(s.id) : SW.sel.delete(s.id)); swRender(); };
TX.swDelSel = () => TX.swDelete([...SW.sel]);
TX.swDelete = ids => {
  const names = ids.map(i => (TS.sm[i] || {}).nama).filter(Boolean), kid = SW.id;
  mOpen('Hapus siswa dari kelas?', '<p style="margin:0 0 8px"><b>' + ids.length + ' siswa</b> akan dihapus: ' + esc(names.slice(0, 5).join(', ')) + (names.length > 5 ? ' dan ' + (names.length - 5) + ' lainnya' : '') + '.</p><div class="ins">Akun beserta <b>seluruh nilai, jawaban, poin, dan catatan integritas</b> siswa ikut terhapus dan <b>tidak bisa dibatalkan</b>. Siswa yang sedang online langsung dikeluarkan. Sertifikat yang sudah terbit tetap tersimpan sebagai arsip.</div>',
    '<button class="tb" onclick="TX.kelasSiswa(\'' + kid + '\')">Batal</button><button class="tb d" id="swYes">' + ico('delete', 18) + 'Ya, hapus ' + ids.length + ' siswa</button>');
  $('#swYes').onclick = async () => {
    const set = new Set(ids), b = TS.b, snap = { st: b.students.slice(), nl: b.nilai.slice(), lg: b.logs.slice() };
    b.students = b.students.filter(s => !set.has(s.id)); b.nilai = b.nilai.filter(n => !set.has(n.IDSiswa)); b.logs = b.logs.filter(l => !set.has(l.IDSiswa)); idx(); render();
    TX.kelasSiswa(kid); toast('Menghapus ' + ids.length + ' siswa…', 'in', 1500);
    try { const r = await apiT('apiDeleteStudents', ids); persistBoot(); toast(r.deleted + ' siswa dihapus dari kelas', 'ok'); }
    catch (e) { b.students = snap.st; b.nilai = snap.nl; b.logs = snap.lg; idx(); render(); if ($('#swList')) swRender(); toast(e.message, 'er', 5000); }
  };
};

/* ---------- Bank soal ---------- */
T.bank = function () {
  const q = (TS.q.bank || '').toLowerCase(), fm = TS.q.bm || '', fj = TS.q.bj || '', fk = TS.q.bk || '';
  const rows = TS.b.bank.filter(s => (!q || (s.TeksSoal + s.Topik + s.Mapel).toLowerCase().includes(q)) && (!fm || s.Mapel === fm) && (!fj || s.Jenis === fj) && (!fk || s.Kesulitan === fk));
  const mapel = [...new Set(TS.b.bank.map(s => s.Mapel))].sort();
  $('#t-bank').innerHTML = ph('Konten', 'Bank Soal', 'Kelola soal pilihan ganda, isian singkat, dan uraian milik Anda (' + TS.b.bank.length + ' soal).', '<button class="tb a" onclick="TX.aiOpen()">' + ico('auto_awesome') + 'Buat Soal dengan AI</button><button class="tb ic" aria-label="Pengaturan AI" title="Pengaturan AI" onclick="TX.aiSettings()">' + ico('key') + '</button><button class="tb" onclick="TX.bankImport()">' + ico('upload_file') + 'Impor</button><button class="tb p" onclick="TX.soalForm()">' + ico('add') + 'Tambah Soal</button>') +
    '<div class="tools"><input class="tin" id="bq" placeholder="Cari soal, topik…" value="' + esc(TS.q.bank || '') + '">' + sel('bm', [['', 'Semua mapel']].concat(mapel), fm) + sel('bj', [['', 'Semua jenis'], 'Pilihan Ganda', 'Isian Singkat', 'Uraian'], fj) + sel('bk', [['', 'Semua tingkat'], 'Mudah', 'Sedang', 'Sulit'], fk) + '</div>' +
    (rows.length ? '<div class="twrap"><table class="tt"><thead><tr><th>Soal</th><th>Mapel</th><th>Jenis</th><th>Tingkat</th><th class="num">Bobot</th><th></th></tr></thead><tbody>' + slice('bank', rows, 10).map(s => '<tr><td style="max-width:420px"><div class="ell" style="max-width:420px">' + esc(s.TeksSoal) + '</div><small style="color:var(--t-mu)">' + esc(s.Topik) + '</small></td><td>' + esc(s.Mapel) + '</td><td>' + chipT(s.Jenis, s.Jenis === 'Uraian' ? 'wa' : s.Jenis === 'Isian Singkat' ? 'bl' : '') + '</td><td>' + chipT(s.Kesulitan, { Mudah: 'ok', Sedang: 'wa', Sulit: 'er' }[s.Kesulitan]) + '</td><td class="num">' + s.Bobot + '</td><td style="white-space:nowrap"><button class="tb sm ic" aria-label="Edit" onclick="TX.soalForm(\'' + s.ID + '\')">' + ico('edit', 16) + '</button> <button class="tb sm ic d" aria-label="Hapus" onclick="TX.soalDel(\'' + s.ID + '\')">' + ico('delete', 16) + '</button></td></tr>').join('') + '</tbody></table>' + pager('bank', rows.length, 10) + '</div>' : empty('quiz', TS.b.bank.length ? 'Tidak ada soal yang cocok.' : 'Bank soal kosong. Tambah atau impor soal.'));
  const rf = debounce(() => { TS.q.bank = val('bq'); TS.pg.bank = 1; T.bank(); const e = $('#bq'); e.focus(); e.setSelectionRange(e.value.length, e.value.length); }, 200);
  $('#bq').oninput = rf; $('#bm').onchange = () => { TS.q.bm = val('bm'); TS.pg.bank = 1; T.bank(); }; $('#bj').onchange = () => { TS.q.bj = val('bj'); TS.pg.bank = 1; T.bank(); }; $('#bk').onchange = () => { TS.q.bk = val('bk'); TS.pg.bank = 1; T.bank(); };
};
let _opsiN = 4;
function soalOpsiHTML(opsi, kunci) { return Array.from({ length: _opsiN }, (_, i) => '<div class="row g8" style="margin-bottom:8px"><input type="radio" name="fK" value="' + i + '" id="fKr' + i + '"' + (opsi[i] != null && opsi[i] === kunci ? ' checked' : '') + ' aria-label="Kunci ' + String.fromCharCode(65 + i) + '"><b style="width:18px">' + String.fromCharCode(65 + i) + '</b><input class="tin" id="fO' + i + '" value="' + esc(opsi[i] || '') + '" placeholder="Opsi ' + String.fromCharCode(65 + i) + '"></div>').join('') + (_opsiN < 6 ? '<button class="tb sm" type="button" onclick="TX.soalOpsi()">' + ico('add', 16) + 'Tambah opsi</button>' : ''); }
function soalSwitch() { const j = val('fJenis'); $('#fPG').classList.toggle('hide', j !== 'Pilihan Ganda'); $('#fKun').classList.toggle('hide', j === 'Pilihan Ganda'); $('#fKunL').textContent = j === 'Isian Singkat' ? 'Kunci jawaban (pisahkan alternatif dengan |)' : 'Rubrik / jawaban acuan'; }
TX.soalOpsi = () => { const cur = readOpsi(); _opsiN++; $('#fPG').innerHTML = soalOpsiHTML(cur.opsi, cur.opsi[cur.k]); };
function readOpsi() { const opsi = []; for (let i = 0; i < _opsiN; i++) opsi.push(val('fO' + i).trim()); const r = $('input[name=fK]:checked'); return { opsi, k: r ? +r.value : -1 }; }
TX.soalForm = id => {
  const s = id ? TS.bm[id] : { Mapel: '', Jenis: 'Pilihan Ganda', TeksSoal: '', Opsi: '', Kunci: '', Bobot: 10, Kesulitan: 'Sedang', Topik: '' }; let op = []; try { op = s.Opsi ? JSON.parse(s.Opsi) : []; } catch (e) { } _opsiN = Math.max(4, op.length);
  mOpen(id ? 'Edit Soal' : 'Tambah Soal', '<div class="frow">' + fld('Jenis soal', sel('fJenis', ['Pilihan Ganda', 'Isian Singkat', 'Uraian'], s.Jenis, 'onchange="soalSwitch()"'), 'fJenis') + fld('Mata pelajaran', inp('fMapel', s.Mapel, 'list="dlM" maxlength="40"') + '<datalist id="dlM">' + [...new Set(TS.b.bank.map(x => x.Mapel))].map(m => '<option value="' + esc(m) + '">').join('') + '</datalist>', 'fMapel') + fld('Topik', inp('fTopik', s.Topik, 'maxlength="60"'), 'fTopik') + '</div><div class="frow">' + fld('Tingkat kesulitan', sel('fKes', ['Mudah', 'Sedang', 'Sulit'], s.Kesulitan), 'fKes') + fld('Bobot (poin)', inp('fBobot', s.Bobot, 'type="number" min="1" max="100"'), 'fBobot') + '</div>' + fld('Teks soal', '<textarea class="tta" id="fTeks" maxlength="3000">' + esc(s.TeksSoal) + '</textarea>', 'fTeks') +
    '<div id="fPG">' + soalOpsiHTML(op, s.Kunci) + '</div><div id="fKun" class="fld">' + '<label id="fKunL" for="fKunci"></label><textarea class="tta" id="fKunci" style="min-height:70px">' + esc(s.Jenis !== 'Pilihan Ganda' ? s.Kunci : '') + '</textarea></div>', '<button class="tb" onclick="mClose()">Batal</button><button class="tb p" onclick="TX.soalSave(\'' + (id || '') + '\')">Simpan</button>', true);
  window.soalSwitch = soalSwitch; soalSwitch();
};
TX.soalSave = id => {
  const j = val('fJenis'), r = { ID: id || genId('Q'), Jenis: j, Mapel: val('fMapel'), Topik: val('fTopik'), Kesulitan: val('fKes'), Bobot: Number(val('fBobot')), TeksSoal: val('fTeks') };
  if (j === 'Pilihan Ganda') { const o = readOpsi(), ops = o.opsi.filter(Boolean); if (ops.length < 2) return toast('Isi minimal 2 opsi', 'er'); if (o.k < 0 || !o.opsi[o.k]) return toast('Pilih kunci jawaban (bulatan di kiri opsi)', 'er'); r.Opsi = ops; r.Kunci = o.opsi[o.k]; } else { r.Kunci = val('fKunci'); if (j === 'Isian Singkat' && !r.Kunci.trim()) return toast('Isi kunci jawaban', 'er'); }
  if (r.TeksSoal.trim().length < 5) return toast('Teks soal terlalu pendek', 'er'); if (!(r.Bobot > 0)) return toast('Bobot harus > 0', 'er');
  mClose(); const local = Object.assign({}, r, { Opsi: j === 'Pilihan Ganda' ? JSON.stringify(r.Opsi) : '' }); saveEnt('BankSoal', local, !id).then(() => toast('Soal tersimpan', 'ok')).catch(() => { });
};
TX.soalDel = id => confirmDel('Hapus soal ini dari bank soal?', () => delEnt('BankSoal', id));
TX.bankImport = () => mOpen('Impor Soal', '<p style="margin:0 0 8px;color:var(--t-mu);font-size:13px">Tempel data dari Excel/Sheets (pemisah <b>Tab</b> atau <b>;</b>), satu soal per baris:<br><code>Mapel ; Jenis ; Teks Soal ; OpsiA|OpsiB|OpsiC|OpsiD ; Kunci ; Bobot ; Kesulitan</code><br>Jenis: Pilihan Ganda / Isian Singkat / Uraian. Maks. 300 baris.</p><textarea class="tta" id="impTxt" style="min-height:200px" placeholder="Matematika;Pilihan Ganda;2+2 = ?;3|4|5|6;4;10;Mudah"></textarea><div id="impRes" style="margin-top:8px;font-size:13px"></div>', '<button class="tb" onclick="mClose()">Batal</button><button class="tb p" id="impGo" onclick="TX.bankImportGo()">Impor</button>', true);
TX.bankImportGo = async () => {
  const lines = val('impTxt').split(/\r?\n/).map(l => l.trim()).filter(Boolean); if (!lines.length) return toast('Tempel data dulu', 'er');
  const recs = lines.map(l => { const c = l.split(l.includes('\t') ? '\t' : ';').map(x => x.trim()); return { Mapel: c[0], Jenis: c[1], TeksSoal: c[2], Opsi: c[1] === 'Pilihan Ganda' ? (c[3] || '').split('|').map(x => x.trim()).filter(Boolean) : '', Kunci: c[4], Bobot: Number(c[5]) || 10, Kesulitan: c[6] || 'Sedang' }; });
  const b = $('#impGo'); b.disabled = true; b.innerHTML = '<span class="spin"></span>';
  try { const r = await apiT('apiSaveBatch', 'BankSoal', recs); TS.b.bank.unshift(...r.saved); render(); persistBoot(); $('#impRes').innerHTML = '<b style="color:var(--t-ok)">' + r.saved.length + ' soal berhasil diimpor.</b>' + (r.errors.length ? '<div style="color:var(--t-er);margin-top:6px">' + r.errors.slice(0, 8).map(esc).join('<br>') + '</div>' : ''); b.textContent = 'Selesai'; b.onclick = mClose; b.disabled = false; }
  catch (e) { toast(e.message, 'er'); b.disabled = false; b.textContent = 'Impor'; }
};

/* ---------- Desain asesmen ---------- */
T.asesmen = function () {
  const rows = TS.b.asesmen.filter(a => !TS.kelas || a.IDKelas === TS.kelas).sort((a, b) => (b.JadwalMulai || 0) - (a.JadwalMulai || 0));
  $('#t-asesmen').innerHTML = ph('Perancang', 'Desain Asesmen', 'Susun Latihan Harian, STS, atau SAS lengkap dengan durasi, jadwal, dan acak soal.', '<button class="tb p" onclick="TX.asForm()">' + ico('add') + 'Asesmen Baru</button>') +
    (rows.length ? '<div class="twrap"><table class="tt"><thead><tr><th>Judul</th><th>Jenis</th><th class="num">Soal</th><th class="num">Durasi</th><th>Jadwal</th><th>Status</th><th></th></tr></thead><tbody>' + rows.map(a => { const n = a.DaftarSoal.split(',').filter(Boolean).length, m = TS.b.misi.find(x => x.IDAsesmen === a.ID); return '<tr><td><b>' + esc(a.Judul) + '</b>' + (m ? '<br><small style="color:var(--t-mu)">Misi di ' + esc((SLOT[m.Lokasi] || {}).nama || m.Lokasi) + '</small>' : '') + '</td><td>' + jenisChip(a.Jenis) + '</td><td class="num">' + n + '</td><td class="num">' + a.Durasi + ' mnt</td><td>' + (a.JadwalMulai ? fmtDT(a.JadwalMulai) + ' → ' + fmtDT(a.JadwalSelesai) : 'Kapan saja') + '</td><td>' + stChip(a.Status) + '</td><td style="white-space:nowrap">' +
      (a.Status === 'Draft' ? '<button class="tb sm a" onclick="TX.asSet(\'' + a.ID + '\',\'Aktif\')">Aktifkan</button> ' : a.Status === 'Aktif' || a.Status === 'Jeda' ? '<button class="tb sm" onclick="TX.asSet(\'' + a.ID + '\',\'Selesai\')">Tutup</button> ' : '<button class="tb sm" onclick="TX.asSet(\'' + a.ID + '\',\'Aktif\')">Buka lagi</button> ') +
      '<button class="tb sm ic" title="CCTV" aria-label="CCTV" onclick="TX.asGo(\'' + a.ID + '\',\'cctv\')">' + ico('videocam', 16) + '</button> <button class="tb sm ic" title="Rekap" aria-label="Rekap" onclick="TX.asGo(\'' + a.ID + '\',\'rekap\')">' + ico('grade', 16) + '</button> <button class="tb sm ic" aria-label="Edit" onclick="TX.asForm(\'' + a.ID + '\')">' + ico('edit', 16) + '</button> <button class="tb sm ic d" aria-label="Hapus" onclick="TX.asDel(\'' + a.ID + '\')">' + ico('delete', 16) + '</button></td></tr>'; }).join('') + '</tbody></table></div>' : empty('assignment', 'Belum ada asesmen untuk kelas ini.'));
};
TX.asGo = (id, v) => { TS.asesmen = id; tGo(v); };
TX.asSet = (id, st) => saveEnt('Asesmen', Object.assign({}, TS.am[id], { Status: st })).then(() => toast('Status: ' + st, 'ok', 1800)).catch(() => { });
TX.asDel = id => confirmDel('Hapus asesmen <b>' + esc(TS.am[id].Judul) + '</b>?', () => delEnt('Asesmen', id));
let _asSel = new Set();
TX.asForm = id => {
  const a = id ? TS.am[id] : { IDKelas: TS.kelas, Jenis: 'STS', Judul: '', DaftarSoal: '', Durasi: 45, JadwalMulai: 0, JadwalSelesai: 0, AcakSoal: 'Ya', Status: 'Draft', KKM: TS.b.cfg.kkm || 75 };
  _asSel = new Set(a.DaftarSoal.split(',').filter(Boolean));
  mOpen(id ? 'Edit Asesmen' : 'Asesmen Baru', '<div class="frow">' + fld('Kelas', sel('aKls', TS.b.classes.map(c => [c.ID, c.NamaKelas]), a.IDKelas), 'aKls') + fld('Jenis', sel('aJen', ['Latihan Harian', 'STS', 'SAS'], a.Jenis), 'aJen') + fld('Status', sel('aSt', ['Draft', 'Aktif', 'Jeda', 'Selesai'], a.Status), 'aSt') + '</div>' + fld('Judul', inp('aJud', a.Judul, 'maxlength="80" placeholder="Contoh: STS Gasal Matematika"'), 'aJud') +
    '<div class="frow">' + fld('Durasi (menit)', inp('aDur', a.Durasi, 'type="number" min="1" max="300"'), 'aDur') + fld('Mulai', inp('aMul', toLocalInput(a.JadwalMulai), 'type="datetime-local"'), 'aMul') + fld('Selesai', inp('aSel', toLocalInput(a.JadwalSelesai), 'type="datetime-local"'), 'aSel') + fld('Acak soal', sel('aAck', ['Ya', 'Tidak'], a.AcakSoal), 'aAck') + fld('KKM', inp('aKkm', a.KKM, 'type="number" min="0" max="100"'), 'aKkm') + '</div>' +
    '<div class="row between" style="margin-bottom:6px"><b style="font-size:13px">Pilih soal dari bank</b><span id="aSum" style="font-size:13px;color:var(--t-mu)"></span></div><input class="tin" id="aQ" placeholder="Cari soal…" style="margin-bottom:8px"><div class="qsel" id="aList"></div><p style="font-size:12px;color:var(--t-mu);margin:8px 0 0">Kosongkan jadwal agar asesmen bisa dikerjakan kapan saja selama statusnya Aktif.</p>',
    '<button class="tb" onclick="mClose()">Batal</button><button class="tb p" onclick="TX.asSave(\'' + (id || '') + '\')">Simpan</button>', true);
  const draw = () => { const q = val('aQ').toLowerCase(); $('#aList').innerHTML = TS.b.bank.filter(s => !q || (s.TeksSoal + s.Mapel + s.Topik).toLowerCase().includes(q)).map(s => '<label><input type="checkbox" value="' + s.ID + '"' + (_asSel.has(s.ID) ? ' checked' : '') + '><span class="grow"><span style="display:block">' + esc(s.TeksSoal.slice(0, 110)) + '</span><small style="color:var(--t-mu)">' + esc(s.Mapel) + ' • ' + s.Jenis + ' • bobot ' + s.Bobot + '</small></span></label>').join('') || '<div class="empty">Tidak ada soal</div>'; sum(); };
  const sum = () => { const b = [..._asSel].reduce((x, i) => x + ((TS.bm[i] || {}).Bobot || 0), 0); $('#aSum').textContent = _asSel.size + ' soal • total bobot ' + b; };
  $('#aList').addEventListener('change', e => { if (e.target.type === 'checkbox') { e.target.checked ? _asSel.add(e.target.value) : _asSel.delete(e.target.value); sum(); } }); $('#aQ').oninput = debounce(draw, 150); draw();
};
TX.asSave = id => {
  const r = { ID: id || genId('AS'), IDKelas: val('aKls'), Jenis: val('aJen'), Judul: val('aJud'), DaftarSoal: [..._asSel], Durasi: Number(val('aDur')), JadwalMulai: fromLocalInput(val('aMul')), JadwalSelesai: fromLocalInput(val('aSel')), AcakSoal: val('aAck'), Status: val('aSt'), KKM: Number(val('aKkm')) };
  if (r.Judul.trim().length < 3) return toast('Judul minimal 3 karakter', 'er'); if (!r.DaftarSoal.length) return toast('Pilih minimal 1 soal', 'er'); if (!(r.Durasi >= 1)) return toast('Durasi tidak valid', 'er'); if (r.JadwalMulai && r.JadwalSelesai && r.JadwalSelesai <= r.JadwalMulai) return toast('Jadwal selesai harus setelah mulai', 'er');
  mClose(); saveEnt('Asesmen', Object.assign({}, r, { DaftarSoal: r.DaftarSoal.join(',') }), !id).then(() => toast('Asesmen tersimpan', 'ok')).catch(() => { });
};

/* ---------- Editor misi 3D (pilih lokasi di peta kota) ---------- */
T.misi = function () {
  const ids = clsAsesmen().map(a => a.ID), ms = TS.b.misi.filter(m => ids.includes(m.IDAsesmen));
  $('#t-misi').innerHTML = ph('Gamifikasi', 'Editor Misi 3D', 'Klik titik di peta kota untuk menempatkan soal sebagai misi dan menentukan hadiah poin.') +
    '<div class="grid g21"><div class="tcard"><h3>Peta Kota EduVerse</h3><p class="sub">Titik <span style="color:#ffc83d">kuning</span> = ada misi, <span style="color:#9aa4b5">abu</span> = kosong. Klik untuk mengatur.</p><canvas id="mmap" class="radar" style="aspect-ratio:1;max-height:560px;cursor:pointer;margin:auto"></canvas></div>' +
    '<div class="tcard"><h3>Daftar misi (' + ms.length + ')</h3><p class="sub">Kelas terpilih</p>' + (ms.length ? ms.map(m => { const a = TS.am[m.IDAsesmen]; return '<div class="fi" style="margin-bottom:8px"><div class="tm"><span>' + esc((SLOT[m.Lokasi] || {}).nama) + '</span>' + chipT(m.Status, m.Status === 'Aktif' ? 'ok' : '') + '</div><b>' + esc(m.Judul) + '</b><div style="color:var(--t-mu);font-size:12px">' + esc(a ? a.Judul : '-') + ' • +' + m.Hadiah + ' XP</div><div class="row g8" style="margin-top:6px"><button class="tb sm" onclick="TX.misiForm(\'' + m.Lokasi + '\')">' + ico('edit', 14) + 'Edit</button><button class="tb sm d" onclick="TX.misiDel(\'' + m.ID + '\')">' + ico('delete', 14) + '</button></div></div>'; }).join('') : empty('map', 'Belum ada misi. Klik titik pada peta.')) + '</div></div>';
  const cv = $('#mmap'), draw = () => drawCityMap(cv, [], MAP_SLOTS.map(s => ({ x: s.x, z: s.z, label: s.nama, r: 9, color: ms.some(m => m.Lokasi === s.id) ? '#ffc83d' : '#8b94a8' }))); draw(); requestAnimationFrame(draw);
  cv.onclick = e => { const r = cv.getBoundingClientRect(), R = 40, wx = ((e.clientX - r.left) / r.width) * 2 * R - R, wz = ((e.clientY - r.top) / r.height) * 2 * R - R; let b = null, bd = 1e9; MAP_SLOTS.forEach(s => { const d = Math.hypot(s.x - wx, s.z - wz); if (d < bd) { bd = d; b = s; } }); if (b && bd < 8) TX.misiForm(b.id); };
};
TX.misiForm = lok => {
  const ex = TS.b.misi.find(m => m.Lokasi === lok && TS.am[m.IDAsesmen] && (!TS.kelas || TS.am[m.IDAsesmen].IDKelas === TS.kelas)), opts = clsAsesmen().filter(a => a.Jenis === 'Latihan Harian' || true).map(a => [a.ID, a.Judul + ' (' + a.Jenis + ')']);
  if (!opts.length) return toast('Buat asesmen dulu di menu Desain Asesmen', 'wa');
  const m = ex || { IDAsesmen: opts[0][0], Lokasi: lok, Hadiah: 20, Judul: '', Status: 'Aktif', Jenis: 'Kuis Pilihan' };
  mOpen('Misi di ' + esc((SLOT[lok] || {}).nama), fld('Asesmen yang dijadikan misi', sel('mAs', opts, m.IDAsesmen), 'mAs') + fld('Judul misi (opsional)', inp('mJud', m.Judul, 'maxlength="80"'), 'mJud') + '<div class="frow">' + fld('Hadiah poin (XP)', inp('mHad', m.Hadiah, 'type="number" min="0" max="500"'), 'mHad') + fld('Jenis interaksi', sel('mJen', ['Kuis Pilihan', 'Eksperimen', 'Teka-teki', 'Tantangan Waktu'], m.Jenis), 'mJen') + fld('Status', sel('mSt', ['Aktif', 'Nonaktif'], m.Status), 'mSt') + '</div>', '<button class="tb" onclick="mClose()">Batal</button><button class="tb p" onclick="TX.misiSave(\'' + lok + '\',\'' + (ex ? ex.ID : '') + '\')">Simpan</button>');
};
TX.misiSave = (lok, id) => { const r = { ID: id || genId('MS'), IDAsesmen: val('mAs'), Lokasi: lok, Jenis: val('mJen'), Hadiah: Number(val('mHad')) || 0, Judul: val('mJud') || (TS.am[val('mAs')] || {}).Judul, Status: val('mSt') }; mClose(); saveEnt('Misi', r, !id).then(() => toast('Misi tersimpan di ' + SLOT[lok].nama, 'ok')).catch(() => { }); };
TX.misiDel = id => confirmDel('Hapus misi ini dari peta?', () => delEnt('Misi', id));

/* =====================================================================
   DASHBOARD GURU (bagian B): CCTV live, integritas, rekap, sertifikat, admin
   ===================================================================== */

/* ---------- CCTV Live (polling 3–4 dtk, hanya saat tab CCTV terbuka) ---------- */
const stCls = s => s === 'pelanggaran' ? 'er' : s === 'perhatian' ? 'wa' : 'ok', stTxt = s => ({ aman: 'Aman', perhatian: 'Perhatian', pelanggaran: 'Pelanggaran' }[s]);
let _remT = 0;
T.cctv = function () {
  const all = clsAsesmen(), as = all.filter(a => a.Jenis !== 'Latihan Harian').concat(all.filter(a => a.Jenis === 'Latihan Harian'));
  if (!TS.asesmen || !as.some(a => a.ID === TS.asesmen)) TS.asesmen = ((as.find(a => a.Status === 'Aktif') || as[0]) || {}).ID || '';
  if (TS.mode === 'radar') TS.mode = '3d';
  const a = TS.am[TS.asesmen] || {}, k = TS.cm[TS.kelas] || {}, prev = TS.live;
  $('#t-cctv').innerHTML = '<div class="tcard" id="cHdr" style="margin-bottom:16px"><div class="row between wrap g12"><div class="grow" style="min-width:260px"><div class="row g8 wrap" style="font-size:11px;font-weight:700"><span class="chipT bl"><span class="dot" style="background:#DC2626;animation:pulse 1.4s infinite"></span>LIVE • SINKRON ' + Math.max(3, TS.b.cfg.syncSeconds || 4) + ' DETIK</span><span style="color:var(--t-mu)">ID Sesi: #' + esc((TS.asesmen || '').slice(-8)) + '</span></div>' +
    '<h1 style="margin:6px 0 4px;font-family:var(--f-h);font-size:26px;line-height:32px">CCTV Live <span style="font-weight:500;color:var(--t-mu);font-size:16px">— Pengawasan Real-Time</span></h1><div class="row g8 wrap" style="font-size:13px;color:var(--t-mu)"><span>' + ico('apartment', 16) + ' ' + esc(k.NamaKelas || '-') + '</span><span>•</span>' + (as.length ? sel('cAs', as.map(x => [x.ID, x.Judul + ' (' + x.Status + ')']), TS.asesmen, 'style="max-width:300px;min-height:34px;padding:4px 8px" aria-label="Asesmen"') : '<span>Belum ada asesmen</span>') + '<span>•</span><span>' + ico('shield', 16) + ' AI Proctoring: Ketat (Level ' + (TS.b.cfg.proctoring || 3) + ')</span></div></div>' +
    '<div class="row g8 wrap"><div class="seg2"><button id="cmG" class="' + (TS.mode === 'grid' ? 'on' : '') + '" onclick="TX.cMode(\'grid\')">' + ico('grid_view', 16) + ' Grid Siswa</button><button id="cmR" class="' + (TS.mode === '3d' ? 'on' : '') + '" onclick="TX.cMode(\'3d\')">' + ico('view_in_ar', 16) + ' Kota 3D (Live)</button></div><button class="tb p" onclick="$(\'#cMemo\').focus()">' + ico('campaign') + 'Siarkan Memo</button></div></div></div>' +
    '<div class="grid g4" id="cStats" style="margin-bottom:16px"></div><div class="grid g31"><div class="tcard cstage" id="cStage"><div class="row between wrap g8" style="margin-bottom:12px"><h3 style="margin:0">Matriks Siswa <span style="font-weight:400;color:var(--t-mu);font-size:13px">(status langsung)</span></h3><div class="row g8 wrap"><span class="row g8 wrap" id="cLeg"></span><button class="tb sm" id="cFsBtn" type="button" onclick="TX.cFull()">' + ico('fullscreen', 18) + 'Layar Penuh</button></div></div><div id="cMatrix"></div></div>' +
    '<div class="grid" style="align-content:start"><div class="tcard"><h3>' + ico('gpp_maybe', 20) + ' Catatan Anomali &amp; Integritas</h3><div class="feed" id="cFeed" style="margin-top:10px"></div></div><div class="tcard" style="background:var(--t-navy);color:#fff;border-color:transparent"><h3 style="color:#fff">' + ico('campaign', 20) + ' Siaran Cepat ke Seluruh Layar Siswa</h3><p class="sub" style="color:#b6c6e0">Pesan muncul sebagai banner di layar siswa.</p><textarea class="tta" id="cMemo" maxlength="240" style="min-height:64px;background:#fff;color:#111" placeholder="Harap fokus pada lembar soal Anda!"></textarea><button class="tb a" style="width:100%;margin-top:8px" onclick="TX.memo()">' + ico('send', 18) + 'Siarkan Sekarang</button></div><div class="tcard"><h3>Aksi Pengawas Darurat</h3><div class="grid g2" id="cAct" style="margin-top:10px"></div></div></div></div>';
  const s = $('#cAs'); if (s) s.onchange = () => { TS.asesmen = s.value; TS.live = null; TS.pg.cctv = 1; liveStop(); liveStart(); T.cctv(); };
  if (prev) liveRender();
};
function liveStart() {
  liveStop(); if (!TS.kelas) return; TS.liveOn = true;
  const tick = async () => { if (!TS.liveOn) return; if (!document.hidden) { try { TS.live = await apiT('apiLive', TS.kelas, TS.asesmen || ''); TS.liveAt = Date.now(); liveRender(); setSync(true); } catch (e) { setSync(false, e.net ? 'Offline' : 'Gagal sinkron'); } } TS.liveT = setTimeout(tick, document.hidden ? 10000 : Math.max(3000, (TS.b.cfg.syncSeconds || 4) * 1000)); };
  tick(); _remT = setInterval(remTick, 1000);
}
function liveStop() { TS.liveOn = false; clearTimeout(TS.liveT); clearInterval(_remT); }
function remTick() { const d = TS.live, el = $('#cRem'); if (!d || !el) return; const paused = d.as && d.as.status === 'Jeda'; el.textContent = mmss(Math.max(0, d.stats.remain - (paused ? 0 : Date.now() - TS.liveAt))); }
TX.cMode = m => { TS.mode = m; $('#cmG').classList.toggle('on', m === 'grid'); $('#cmR').classList.toggle('on', m === '3d'); if (m === 'grid') Spec.unmount(); liveRender(); };
function liveRender() {
  const d = TS.live; if (!d || TS.view !== 'cctv' || !$('#cStats')) return; const S = d.stats, a = d.as || {}, f = TS.q.cf || '';
  const k = (l, v, n, ic, c) => '<div class="tcard kpi ' + (c || '') + '"><div class="kl"><span>' + l + '</span>' + ico(ic, 22) + '</div><div class="kv">' + v + '</div><div class="kn">' + n + '</div></div>';
  $('#cStats').innerHTML = k('Total Peserta', S.total + '<small>kelas</small>', S.online + ' tersambung', 'wifi') + k('Mengerjakan Normal', S.normal, 'Siswa tanpa pelanggaran', 'task_alt') + k('Anomali Terdeteksi', S.anomali, S.anomali ? 'Perlu tindakan' : 'Tidak ada', 'warning', S.anomali ? 'er' : '') + '<div class="tcard kpi dk"><div class="kl"><span>Sisa Waktu Ujian</span>' + ico('hourglass_top', 22) + '</div><div class="kv" id="cRem">' + mmss(S.remain) + '</div><div class="kn">' + (a.status === 'Jeda' ? '⏸ Sesi dijeda' : S.remain <= 0 ? (S.closeAt ? 'Tidak ada yang mengerjakan • jadwal tutup ' + fmtDT(S.closeAt) : 'Tidak ada yang mengerjakan') : a.extra ? '+' + num(a.extra, 0) + ' menit tambahan' : 'Waktu berjalan') + '</div></div>';
  const cnt = { aman: 0, perhatian: 0, pelanggaran: 0 }; d.students.forEach(x => cnt[x.status]++);
  $('#cLeg').innerHTML = [['', 'Semua', d.students.length, 'bl'], ['aman', 'Aman', cnt.aman, 'ok'], ['perhatian', 'Perhatian', cnt.perhatian, 'wa'], ['pelanggaran', 'Pelanggaran', cnt.pelanggaran, 'er']].map(x => '<button class="chipT ' + x[3] + '" style="' + (f === x[0] ? 'outline:2px solid var(--t-blue)' : '') + '" onclick="TX.cFilter(\'' + x[0] + '\')">' + x[1] + ' ' + x[2] + '</button>').join('');
  const order = { pelanggaran: 0, perhatian: 1, aman: 2 }, list = d.students.filter(x => !f || x.status === f).sort((p, q) => order[p.status] - order[q.status] || (q.online - p.online) || p.nama.localeCompare(q.nama));
  if (TS.mode !== '3d') Spec.unmount();
  if (TS.mode === '3d') { cctv3d(d);   } else if (!list.length) $('#cMatrix').innerHTML = empty('groups', d.students.length ? 'Tidak ada siswa pada filter ini.' : 'Belum ada siswa di kelas ini.');
  else $('#cMatrix').innerHTML = '<div class="sgrid">' + slice('cctv', list, 8).map(x => { const pct = x.total ? Math.round(x.done / x.total * 100) : 0; return '<div class="scard ' + x.status + (x.online ? '' : ' off') + '"><div class="hd">' + avs(x.avatar, 40) + '<div class="grow"><b class="ell">' + esc(x.nama) + '</b><small>Lv ' + x.level + ' • ' + (x.online ? 'Online' : x.last ? 'Terakhir ' + fmtTm(x.last).slice(0, 5) : 'Offline') + '</small></div>' + chipT(stTxt(x.status), stCls(x.status)) + '</div><div style="font-size:12px;color:var(--t-mu)">' + esc(x.aktivitas) + '</div>' + (x.total ? '<div class="row between" style="font-size:12px"><span>Progres: ' + x.done + ' / ' + x.total + '</span><b>' + pct + '%</b></div><div class="pbar"><i style="width:' + pct + '%"></i></div>' : '') + '<div class="row between" style="font-size:12px"><span>Integritas <b>' + x.integ + '%</b></span><span>' + (x.viol ? x.viol + ' pelanggaran' : 'Bersih') + '</span></div><div class="row g8"><button class="tb sm' + (x.status !== 'aman' ? ' d' : '') + '" style="flex:1" ' + (x.online ? '' : 'disabled') + ' onclick="TX.warn(\'' + x.id + '\')">' + ico('notifications_active', 16) + 'Tegur</button><button class="tb sm" style="flex:1" onclick="TX.liveDetail(\'' + x.id + '\')">' + ico('visibility', 16) + 'Detail</button></div></div>'; }).join('') + '</div>' + pager('cctv', list.length, 8);
  $('#cFeed').innerHTML = d.feed.length ? d.feed.slice(0, 20).map(e => '<div class="fi ' + (e.risiko === 'Kritis' || e.risiko === 'Tinggi' ? 'er' : e.risiko === 'Sedang' ? 'wa' : '') + '"><div class="tm"><span>' + fmtTm(e.t) + '</span>' + chipT(e.k.replace('_', ' '), riskCls(e.risiko)) + '</div><b>' + esc(e.nama) + '</b> — ' + esc(e.d || e.k) + (e.n > 1 ? ' (' + e.n + 'x)' : '') + '</div>').join('') : '<div class="empty" style="padding:16px">Belum ada anomali. Semua tertib ✅</div>';
  const st = a.status || (TS.am[TS.asesmen] || {}).Status;
  $('#cAct').innerHTML = (st === 'Draft' || st === 'Selesai' ? '<button class="tb a" style="grid-column:1/-1" onclick="TX.liveAct(\'open\')">' + ico('play_arrow') + (st === 'Draft' ? 'Mulai Sesi' : 'Buka Kembali') + '</button>' : '<button class="tb" onclick="TX.liveAct(\'pause\')">' + ico(st === 'Jeda' ? 'play_arrow' : 'pause_circle') + (st === 'Jeda' ? 'Lanjutkan' : 'Jeda Sesi') + '</button><button class="tb" onclick="TX.liveAct(\'extend\')">' + ico('more_time') + '+10 Menit</button><button class="tb d" style="grid-column:1/-1" onclick="TX.liveEnd()">' + ico('stop_circle') + 'Akhiri Sesi &amp; Kumpulkan Semua</button>');
}
TX.cFilter = f => { TS.q.cf = TS.q.cf === f ? '' : f; TS.pg.cctv = 1; liveRender(); };
TX.memo = async () => { const t = val('cMemo').trim(); if (!t) return toast('Tulis pesan dulu', 'wa'); $('#cMemo').value = ''; toast('Pesan disiarkan ke seluruh siswa', 'ok', 2200); try { await apiT('apiAction', { kid: TS.kelas, act: 'memo', text: t }); } catch (e) { toast(e.message, 'er'); $('#cMemo').value = t; } };
TX.warn = id => { const s = TS.sm[id] || {}; mOpen('Tegur ' + esc(s.nama || 'siswa'), fld('Pesan peringatan', '<textarea class="tta" id="wTxt" maxlength="240">Harap fokus pada lembar soal Anda!</textarea>', 'wTxt'), '<button class="tb" onclick="mClose()">Batal</button><button class="tb d" onclick="TX.warnGo(\'' + id + '\')">' + ico('notifications_active', 18) + 'Kirim Teguran</button>'); };
TX.warnGo = async id => { const t = val('wTxt'); mClose(); toast('Teguran terkirim', 'ok', 1800); try { await apiT('apiAction', { kid: TS.kelas, act: 'warn', sid: id, text: t }); } catch (e) { toast(e.message, 'er'); } };
TX.liveAct = async act => {
  const a = TS.am[TS.asesmen], d = TS.live; if (!a) return; const prev = { st: a.Status, ex: a.ExtraMenit };
  if (act === 'pause') a.Status = a.Status === 'Jeda' ? 'Aktif' : 'Jeda'; else if (act === 'extend') { a.ExtraMenit += 10; if (d) d.stats.remain += 600000; } else if (act === 'open') a.Status = 'Aktif';
  if (d && d.as) d.as.status = a.Status; liveRender();
  try { const r = await apiT('apiAction', { kid: TS.kelas, aid: a.ID, act, menit: 10 }); a.Status = r.status; a.ExtraMenit = r.extra; if (d && d.as) d.as.status = r.status; liveRender(); toast(act === 'extend' ? '+10 menit untuk semua siswa' : 'Status sesi: ' + r.status, 'ok', 2000); }
  catch (e) { a.Status = prev.st; a.ExtraMenit = prev.ex; liveRender(); toast(e.message, 'er'); }
};
TX.liveEnd = () => confirmDel('Akhiri sesi? Semua siswa yang masih mengerjakan akan <b>dikumpulkan otomatis</b>.', () => TX.liveAct('end'));
TX.liveDetail = id => {
  const s = TS.sm[id] || {}, d = TS.live, x = d && d.students.find(z => z.id === id), logs = TS.b.logs.filter(l => l.IDSiswa === id && l.IDAsesmen === TS.asesmen), feed = (d ? d.feed : []).filter(e => e.uid === id);
  mOpen(avs(s.avatar || 0, 34) + ' ' + esc(s.nama || id), (x ? '<div class="grid g3" style="margin-bottom:12px"><div class="tcard kpi"><div class="kl">Integritas</div><div class="kv">' + x.integ + '%</div></div><div class="tcard kpi"><div class="kl">Pelanggaran</div><div class="kv">' + x.viol + '</div></div><div class="tcard kpi"><div class="kl">Progres</div><div class="kv">' + x.done + '<small>/ ' + x.total + '</small></div></div></div>' : '') + '<div class="feed">' + (feed.map(e => '<div class="fi er"><div class="tm"><span>' + fmtTm(e.t) + '</span><span>' + esc(e.risiko) + '</span></div>' + esc(e.d || e.k) + '</div>').join('') + logs.map(l => '<div class="fi ' + (l.Risiko === 'Rendah' ? '' : 'wa') + '"><div class="tm"><span>' + fmtDT(l.Waktu) + '</span><span>' + esc(l.Risiko) + '</span></div>' + esc(l.Jenis) + ' ×' + l.Jumlah + ' — ' + esc(l.Detail) + '</div>').join('') || '<div class="empty">Tidak ada catatan pelanggaran</div>') + '</div>', '<button class="tb" onclick="mClose()">Tutup</button>');
};

/* ---------- Laporan integritas ---------- */
T.integritas = function () {
  const as = clsAsesmen(); if (!TS.asesmen || !as.some(a => a.ID === TS.asesmen)) TS.asesmen = (as[0] || {}).ID || ''; const aid = TS.asesmen, nl = nilaiOf(aid);
  const byS = {}; TS.b.logs.filter(l => l.IDAsesmen === aid).forEach(l => { const o = byS[l.IDSiswa] = byS[l.IDSiswa] || {}; o[l.Jenis] = (o[l.Jenis] || 0) + l.Jumlah; });
  const rows = nl.map(n => { const c = byS[n.IDSiswa] || {}, other = Object.keys(c).filter(k => !['TAB_SWITCH', 'SPLIT_SCREEN', 'SALIN_TEKS'].includes(k)).reduce((x, k) => x + c[k], 0); return { n, s: TS.sm[n.IDSiswa] || {}, tab: c.TAB_SWITCH || 0, sp: c.SPLIT_SCREEN || 0, cp: c.SALIN_TEKS || 0, ot: other }; }).sort((a, b) => a.n.Integritas - b.n.Integritas);
  const tot = nl.reduce((x, n) => x + n.Pelanggaran, 0), risky = nl.filter(n => n.Integritas < 70).length, avg = nl.length ? nl.reduce((x, n) => x + n.Integritas, 0) / nl.length : 100;
  const kpi = (l, v, ic, c) => '<div class="tcard kpi ' + (c || '') + '"><div class="kl"><span>' + l + '</span>' + ico(ic, 20) + '</div><div class="kv">' + v + '</div></div>';
  $('#t-integritas').innerHTML = ph('Keamanan Ujian', 'Laporan Integritas', 'Ringkasan pelanggaran per siswa dan per ujian beserta tingkat risiko.', as.length ? sel('iAs', as.map(a => [a.ID, a.Judul]), aid, 'style="min-width:220px"') : '') + '<div class="grid g4">' + kpi('Peserta', nl.length, 'groups') + kpi('Total Pelanggaran', tot, 'shield', tot ? 'er' : '') + kpi('Risiko Tinggi', risky, 'warning', risky ? 'er' : '') + kpi('Rata-rata Integritas', num(avg, 0) + '%', 'verified_user') + '</div>' +
    '<div class="grid g21" style="margin-top:16px"><div class="tcard"><h3>Peserta &amp; pelanggaran</h3><p class="sub">Diurutkan dari risiko tertinggi</p>' + (rows.length ? '<div class="twrap"><table class="tt"><thead><tr><th>Siswa</th><th class="num">Tab</th><th class="num">Split</th><th class="num">Salin</th><th class="num">Lain</th><th class="num">Integritas</th><th>Risiko</th><th></th></tr></thead><tbody>' + slice('integ', rows, 10).map(r => { const k = riskOf(r.n.Integritas); return '<tr><td>' + avs(r.s.avatar || 0, 28) + ' ' + esc(r.s.nama || r.n.IDSiswa) + '</td><td class="num">' + r.tab + '</td><td class="num">' + r.sp + '</td><td class="num">' + r.cp + '</td><td class="num">' + r.ot + '</td><td class="num"><b>' + r.n.Integritas + '%</b></td><td>' + chipT(k[0], k[1]) + '</td><td><button class="tb sm" onclick="TX.intDetail(\'' + r.n.IDSiswa + '\')">Detail</button></td></tr>'; }).join('') + '</tbody></table>' + pager('integ', rows.length, 10) + '</div>' : empty('verified_user', 'Belum ada peserta pada asesmen ini.')) + '</div><div class="tcard"><h3>Jenis pelanggaran</h3><p class="sub">Total kejadian</p><div class="cv"><canvas id="chInt"></canvas></div></div></div>';
  const sum = k => rows.reduce((x, r) => x + (k === 'tab' ? r.tab : k === 'sp' ? r.sp : k === 'cp' ? r.cp : r.ot), 0);
  mkChart('chInt', 'bar', ['Pindah tab', 'Split screen', 'Salin teks', 'Lainnya'], [{ label: 'Kejadian', data: [sum('tab'), sum('sp'), sum('cp'), sum('ot')], backgroundColor: ['#2F80ED', '#FFC83D', '#DC2626', '#94a3b8'], borderRadius: 6 }]);
  const s = $('#iAs'); if (s) s.onchange = () => { TS.asesmen = s.value; TS.pg.integ = 1; T.integritas(); };
};
TX.intDetail = id => TX.liveDetail(id);

/* ---------- Rekap nilai ---------- */
T.rekap = function () {
  const as = clsAsesmen(); if (!TS.asesmen || !as.some(a => a.ID === TS.asesmen)) TS.asesmen = (as.find(a => nilaiOf(a.ID).length) || as[0] || {}).ID || ''; const a = TS.am[TS.asesmen] || { KKM: 75, Judul: '-', DaftarSoal: '' }, kkm = a.KKM || 75;
  const all = nilaiOf(a.ID), q = (TS.q.rk || '').toLowerCase(), sf = TS.q.rs || '', fin = all.filter(n => n.Status !== 'Mengerjakan');
  const rows = all.map(n => ({ n, s: TS.sm[n.IDSiswa] || { nama: n.IDSiswa, avatar: 0, nisn: '' } })).sort((x, y) => y.n.NilaiAkhir - x.n.NilaiAkhir).map((r, i) => (r.rank = i + 1, r)).filter(r => (!q || (r.s.nama + r.s.nisn).toLowerCase().includes(q)) && (!sf || r.n.Status === sf));
  const avg = fin.length ? fin.reduce((x, n) => x + n.NilaiAkhir, 0) / fin.length : 0, hi = fin.slice().sort((x, y) => y.NilaiAkhir - x.NilaiAkhir)[0], lo = fin.slice().sort((x, y) => x.NilaiAkhir - y.NilaiAkhir)[0], tuntas = fin.filter(n => n.NilaiAkhir >= kkm).length;
  const prevA = as.filter(x => x.ID !== a.ID && x.Jenis === a.Jenis && x.JadwalMulai < (a.JadwalMulai || Infinity)).sort((x, y) => y.JadwalMulai - x.JadwalMulai)[0], pf = prevA ? nilaiOf(prevA.ID).filter(n => n.Status !== 'Mengerjakan') : [], pavg = pf.length ? pf.reduce((x, n) => x + n.NilaiAkhir, 0) / pf.length : null;
  const bins = [0, 0, 0, 0, 0]; fin.forEach(n => bins[n.NilaiAkhir < 60 ? 0 : n.NilaiAkhir < 70 ? 1 : n.NilaiAkhir < 80 ? 2 : n.NilaiAkhir < 90 ? 3 : 4]++); const mx = Math.max(1, ...bins), mode = bins.indexOf(Math.max(...bins)), labs = ['<60', '60-69', '70-79', '80-89', '90-100'];
  const bob = { PG: 0, Isian: 0, Uraian: 0 }; a.DaftarSoal.split(',').forEach(i => { const s = TS.bm[i]; if (s) bob[s.Jenis === 'Pilihan Ganda' ? 'PG' : s.Jenis === 'Isian Singkat' ? 'Isian' : 'Uraian'] += s.Bobot; });
  const kp = (l, v, n, ic, c) => '<div class="tcard kpi"><div class="kl"><span>' + l + '</span>' + ico(ic, 20) + '</div><div class="kv" style="' + (c ? 'color:' + c : '') + '">' + v + '</div><div class="kn">' + n + '</div></div>';
  const sc = (s, m) => s + ' / ' + m;
  $('#t-rekap').innerHTML = '<div class="ph"><div><div class="eb">Evaluasi Pembelajaran Berkelanjutan</div><h1>Rekap Nilai Siswa</h1><p>Hasil asesmen otomatis tersinkron ke Google Sheets, dilengkapi penilaian uraian.</p></div><div class="row g8 wrap"><button class="tb" onclick="TX.xlsx()">' + ico('table_view', 20) + 'Unduh Excel (.xlsx)</button><button class="tb" onclick="TX.pdf()">' + ico('picture_as_pdf', 20) + 'Cetak Rapor Ringkas (PDF)</button><button class="tb a" onclick="TX.mail()">' + ico('forward_to_inbox', 20) + 'Kirim Nilai ke Wali / Gmail</button></div></div>' +
    '<div class="grid g4" style="grid-template-columns:minmax(0,1.6fr) repeat(4,minmax(0,1fr));margin-bottom:16px"><div class="tcard"><div class="kl" style="font-size:11px;font-weight:700;letter-spacing:.05em;color:var(--t-mu);display:flex;justify-content:space-between">KONTEKS PENILAIAN <span class="chipT ok">● Sinkronisasi Realtime</span></div>' + fld('Agenda asesmen', as.length ? sel('rAs', as.map(x => [x.ID, x.Judul + ' (' + x.Jenis + ')']), a.ID) : '<span style="color:var(--t-mu)">Belum ada asesmen</span>') + '<div style="font-size:12px;color:var(--t-mu);display:flex;gap:16px;flex-wrap:wrap"><span>KKM Mata Pelajaran: <b>' + kkm + '</b></span><span>Bobot PG: <b>' + bob.PG + '</b> | Isian: <b>' + bob.Isian + '</b> | Uraian: <b>' + bob.Uraian + '</b></span></div></div>' +
    kp('Rata-rata Kelas', fin.length ? num(avg) : '–', pavg != null && fin.length ? (avg >= pavg ? '↑ +' : '↓ ') + num(avg - pavg) + ' pts dari ' + esc(prevA.Judul) : 'Belum ada pembanding', 'show_chart', 'var(--t-ok)') + kp('Nilai Tertinggi', hi ? num(hi.NilaiAkhir, 0) : '–', hi ? esc((TS.sm[hi.IDSiswa] || {}).nama) : '-', 'military_tech') + kp('Nilai Terendah', lo ? num(lo.NilaiAkhir, 0) : '–', lo && lo.NilaiAkhir < kkm ? '● Di bawah batas KKM (' + kkm + ')' : 'Di atas KKM', 'trending_down') + kp('Ketuntasan Klasikal', fin.length ? Math.round(tuntas / fin.length * 100) + '%' : '–', tuntas + ' / ' + fin.length + ' Siswa Tuntas', 'donut_large') + '</div>' +
    '<div class="tcard" style="margin-bottom:16px"><div class="row between wrap g8"><div><h3>Distribusi Frekuensi Rentang Nilai</h3><p class="sub">Sebaran capaian belajar siswa berdasarkan rentang skor 0-100</p></div><div class="row g12" style="font-size:12px;color:var(--t-mu)"><span><i class="dot" style="background:#fbcfd0"></i> Perlu Remedial (&lt;70)</span><span><i class="dot"></i> Tuntas / Mandiri (70-100)</span></div></div><div class="hist">' + bins.map((c, i) => '<div class="c"><div class="v">' + c + (i === mode && c ? ' (Modus)' : '') + '</div><div class="b ' + (i === mode && c ? 'hi' : i === 0 ? 'lo' : '') + '" style="height:' + Math.round(c / mx * 120) + 'px"></div><div class="x">' + labs[i] + '<small>' + c + ' siswa (' + (fin.length ? Math.round(c / fin.length * 100) : 0) + '%)</small></div></div>').join('') + '</div></div>' +
    '<div class="tcard" style="padding:0"><div class="tools" style="padding:12px 12px 0"><input class="tin" id="rq" placeholder="Cari nama atau NISN…" value="' + esc(TS.q.rk || '') + '">' + sel('rSt', [['', 'Semua Status Penilaian'], 'Selesai', 'Perlu Dinilai', 'Mengerjakan'], sf) + '<span class="sp" style="flex:1"></span><span style="font-size:13px;color:var(--t-mu)">Menampilkan <b>' + Math.min(rows.length, 8) + '</b> dari <b>' + all.length + '</b> siswa</span></div>' +
    (rows.length ? '<div class="twrap" style="border:0;border-radius:0"><table class="tt"><thead><tr><th>Peringkat</th><th>Identitas Siswa</th><th class="num">Pilihan Ganda</th><th class="num">Isian</th><th class="num">Uraian</th><th class="num">Nilai Akhir</th><th>Integritas AI</th><th>Status</th><th>Aksi</th></tr></thead><tbody>' + slice('rekap', rows, 8).map(r => { const n = r.n, pend = n.Status === 'Perlu Dinilai', k = riskOf(n.Integritas); return '<tr class="' + (pend ? 'warnrow' : '') + '"><td><span class="chipT" style="width:30px;height:30px;justify-content:center;border-radius:50%;' + (r.rank === 1 ? 'background:#FFE9A8;color:#7a5200' : 'background:var(--t-soft);color:var(--t-blue)') + '">' + r.rank + '</span></td><td>' + avs(r.s.avatar, 36) + ' <b>' + esc(r.s.nama) + '</b><div style="font-size:11px;color:var(--t-mu);margin-left:44px;margin-top:-4px">NISN: ' + esc(r.s.nisn || '-') + '</div></td><td class="num">' + sc(n.SkorPG, n.MaksPG) + '</td><td class="num">' + sc(n.SkorIsian, n.MaksIsian) + '</td><td class="num">' + (pend ? '- / ' + n.MaksUraian : sc(n.SkorUraian, n.MaksUraian)) + '</td><td class="num"><span class="sc ' + scoreCls(n.NilaiAkhir, kkm) + '">' + num(n.NilaiAkhir) + (pend ? '*' : '') + '</span></td><td>' + chipT(n.Integritas + '% ' + k[0], k[1]) + '</td><td>' + chipT(n.Status === 'Selesai' ? 'Lengkap Dinilai' : n.Status === 'Perlu Dinilai' ? 'Perlu Dinilai Guru' : 'Mengerjakan', n.Status === 'Selesai' ? 'ok' : 'wa') + '</td><td>' + (pend ? '<button class="tb sm p" onclick="TX.grade(\'' + n.IDAsesmen + '\',\'' + n.IDSiswa + '\')">' + ico('edit_note', 16) + 'Beri Nilai Uraian</button>' : '<button class="tb sm" onclick="TX.sheet(\'' + n.IDAsesmen + '\',\'' + n.IDSiswa + '\')">Lihat Lembar</button>') + '</td></tr>'; }).join('') + '</tbody></table></div>' + pager('rekap', rows.length, 8) : empty('grade', all.length ? 'Tidak ada data pada filter ini.' : 'Belum ada siswa yang mengerjakan asesmen ini.')) + '<div style="padding:10px 14px;font-size:12px;color:var(--t-mu);border-top:1px solid var(--t-bd)">' + ico('sync', 14) + ' Terakhir sinkronisasi ke spreadsheet: ' + fmtTm(TS.bg || Date.now()).slice(0, 5) + ' WITA (otomatis)</div></div>';
  const s = $('#rAs'); if (s) s.onchange = () => { TS.asesmen = s.value; TS.pg.rekap = 1; T.rekap(); };
  $('#rq').oninput = debounce(() => { TS.q.rk = val('rq'); TS.pg.rekap = 1; T.rekap(); const e = $('#rq'); e.focus(); e.setSelectionRange(e.value.length, e.value.length); }, 200); $('#rSt').onchange = () => { TS.q.rs = val('rSt'); TS.pg.rekap = 1; T.rekap(); };
};
const dl = (blob, name) => { const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 8000); };
TX.xlsx = async () => {
  const a = TS.am[TS.asesmen]; if (!a) return toast('Pilih asesmen', 'wa'); const rows = nilaiOf(a.ID).slice().sort((x, y) => y.NilaiAkhir - x.NilaiAkhir).map((n, i) => { const s = TS.sm[n.IDSiswa] || {}; return [i + 1, s.nama || n.IDSiswa, s.nisn || '', n.SkorPG, n.MaksPG, n.SkorIsian, n.MaksIsian, n.SkorUraian, n.MaksUraian, n.NilaiAkhir, n.NilaiAkhir >= a.KKM ? 'Tuntas' : 'Belum tuntas', n.Integritas, n.Status]; });
  const head = ['No', 'Nama', 'NISN', 'PG', 'Maks PG', 'Isian', 'Maks Isian', 'Uraian', 'Maks Uraian', 'Nilai Akhir', 'Ketuntasan', 'Integritas %', 'Status'], fn = 'Rekap_' + a.Judul.replace(/\W+/g, '_');
  toast('Menyiapkan file…', 'in', 1500);
  try { await LIB.xlsx(); const ws = XLSX.utils.aoa_to_sheet([head].concat(rows)); ws['!cols'] = head.map((h, i) => ({ wch: i === 1 ? 26 : 13 })); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Rekap'); const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }); dl(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fn + '.xlsx'); toast('Excel diunduh', 'ok'); }
  catch (e) { const csv = [head].concat(rows).map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n'); dl(new Blob(['\ufeff' + csv], { type: 'text/csv' }), fn + '.csv'); toast('Library Excel tidak termuat — diunduh sebagai CSV', 'wa', 4000); }
};
TX.pdf = async () => {
  const a = TS.am[TS.asesmen]; if (!a) return toast('Pilih asesmen', 'wa'); toast('Membuat PDF…', 'in', 3000);
  try { const r = await apiT('apiExportPdf', a.ID), bin = atob(r.b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); const blob = new Blob([u8], { type: 'application/pdf' }), url = URL.createObjectURL(blob);
    mOpen('Pratinjau Rapor Ringkas', '<iframe src="' + url + '" style="width:100%;height:60vh;border:1px solid var(--t-bd);border-radius:8px" title="Pratinjau PDF"></iframe>' + (r.url ? '<p style="font-size:12px;color:var(--t-mu);margin:8px 0 0">Salinan tersimpan di Google Drive folder Rekap_Nilai.</p>' : ''), '<button class="tb" onclick="mClose()">Tutup</button><button class="tb p" id="pdfDl">' + ico('download', 18) + 'Unduh PDF</button>', true); $('#pdfDl').onclick = () => dl(blob, r.name); }
  catch (e) { toast(e.message, 'er', 5000); }
};
TX.mail = () => confirmMail();
function confirmMail() { mOpen('Kirim nilai via Gmail', '<p style="margin:0">Nilai dikirim ke alamat email pada kolom NISN/Email siswa (hanya yang berisi “@”). Lanjutkan?</p>', '<button class="tb" onclick="mClose()">Batal</button><button class="tb a" id="mlGo">Kirim</button>'); $('#mlGo').onclick = async () => { mClose(); toast('Mengirim email…', 'in', 2500); try { const r = await apiT('apiSendGrades', TS.asesmen); toast(r.sent + ' dari ' + r.total + ' email terkirim', 'ok', 4000); } catch (e) { toast(e.message, 'er', 5000); } }; }
TX.sheet = async (aid, sid) => {
  mOpen('Lembar Jawaban', '<div class="center" style="padding:30px"><span class="spin" style="width:30px;height:30px;color:var(--t-blue)"></span></div>', '', true);
  try { const d = await apiT('apiGetSheet', aid, sid), has = d.items.some(i => i.status !== 'Kosong');
    $('#mdl header h3').innerHTML = esc(d.siswa) + ' — ' + esc(d.judul); $('#mdl .bd2').innerHTML = has ? d.items.map((i, k) => { const ok = i.jenis !== 'Uraian' && Number(i.skor) > 0; return '<div class="fi" style="margin-bottom:10px;background:var(--t-card);border:1px solid var(--t-bd)"><div class="tm"><span>Soal ' + (k + 1) + ' • ' + esc(i.jenis) + '</span>' + chipT(i.skor === '' ? 'Belum dinilai' : i.skor + ' / ' + i.bobot, i.skor === '' ? 'wa' : ok || i.jenis === 'Uraian' ? 'ok' : 'er') + '</div><div style="margin-bottom:6px">' + esc(i.teks) + '</div><div style="font-size:12px"><b>Jawaban siswa:</b> ' + (esc(i.jawaban) || '<i style="color:var(--t-mu)">kosong</i>') + '</div><div style="font-size:12px;color:var(--t-mu)"><b>Kunci/acuan:</b> ' + esc(i.kunci) + '</div></div>'; }).join('') : empty('description', 'Lembar jawaban rinci tidak tersedia (data ringkasan saja).');
    $('#mdl').insertAdjacentHTML('beforeend', '<footer><button class="tb d" onclick="TX.reset(\'' + aid + '\',\'' + sid + '\')">' + ico('restart_alt', 18) + 'Reset Percobaan</button><button class="tb" onclick="mClose()">Tutup</button></footer>'); }
  catch (e) { mClose(); toast(e.message, 'er'); }
};
TX.reset = (aid, sid) => confirmDel('Reset percobaan siswa ini? Nilai & jawaban dihapus, siswa dapat mengerjakan ulang.', async () => { try { await apiT('apiResetAttempt', aid, sid); TS.b.nilai = TS.b.nilai.filter(n => n.ID !== sid + '|' + aid); render(); toast('Percobaan direset', 'ok'); } catch (e) { toast(e.message, 'er'); } });
TX.grade = async (aid, sid) => {
  mOpen('Beri Nilai Uraian', '<div class="center" style="padding:30px"><span class="spin" style="width:30px;height:30px;color:var(--t-blue)"></span></div>', '', true);
  try { const d = await apiT('apiGetSheet', aid, sid), ur = d.items.filter(i => i.jenis === 'Uraian'); $('#mdl header h3').innerHTML = 'Nilai Uraian — ' + esc(d.siswa);
    $('#mdl .bd2').innerHTML = ur.length ? ur.map((i, k) => '<div class="fld"><label>Soal uraian ' + (k + 1) + ' (maks ' + i.bobot + ')</label><div class="fi" style="background:var(--t-ne-bg)">' + esc(i.teks) + '</div><div class="fi" style="border:1px solid var(--t-bd);background:var(--t-card)"><b style="font-size:12px">Jawaban:</b><br>' + (esc(i.jawaban) || '<i>kosong</i>') + '</div><div style="font-size:12px;color:var(--t-mu)">Acuan: ' + esc(i.kunci) + '</div><div class="row g8"><label for="gs' + k + '" style="font-size:13px;color:var(--t-tx)">Skor:</label><input class="tin" style="max-width:110px" type="number" min="0" max="' + i.bobot + '" id="gs' + k + '" data-sid="' + i.id + '" value="' + (i.skor === '' ? '' : i.skor) + '"><span style="font-size:12px;color:var(--t-mu)">/ ' + i.bobot + '</span></div></div>').join('') : empty('edit_note', 'Tidak ada soal uraian.');
    $('#mdl').insertAdjacentHTML('beforeend', '<footer><button class="tb" onclick="mClose()">Batal</button><button class="tb p" id="gsGo">Simpan Nilai</button></footer>');
    $('#gsGo').onclick = async () => { const sc = {}; $$('input[data-sid]').forEach(e => { if (e.value !== '') sc[e.dataset.sid] = Number(e.value); }); if (!Object.keys(sc).length) return toast('Isi skor dulu', 'wa'); $('#gsGo').disabled = true; try { const p = await apiT('apiGradeEssay', aid, sid, sc), n = TS.b.nilai.find(x => x.ID === p.ID); if (n) Object.assign(n, p); mClose(); render(); toast('Nilai uraian tersimpan', 'ok'); } catch (e) { toast(e.message, 'er'); $('#gsGo').disabled = false; } }; }
  catch (e) { mClose(); toast(e.message, 'er'); }
};

/* ---------- Sertifikat ---------- */
T.sertifikat = function () {
  const st = clsStudents().slice().sort((a, b) => b.poin - a.poin), ids = new Set(st.map(s => s.id)), certs = TS.b.certs.filter(c => ids.has(c.IDSiswa)).sort((a, b) => b.Tanggal - a.Tanggal), AW = ['Siswa Teladan', 'Juara 1 Kelas', 'Juara 2 Kelas', 'Juara 3 Kelas', 'Nilai Tertinggi', 'Peserta Paling Aktif', 'Kemajuan Terbaik'];
  $('#t-sertifikat').innerHTML = ph('Apresiasi', 'Sertifikat Apresiasi', 'Cetak sertifikat PDF ber-QR dari Google Docs, tersimpan otomatis di Google Drive.') + '<div class="grid g2"><div class="tcard"><h3>Buat sertifikat</h3><p class="sub">Pilih siswa dan jenis penghargaan</p>' + fld('Siswa', sel('cSw', st.map(s => [s.id, s.nama + ' (' + num(s.poin, 0) + ' poin)']), (st[0] || {}).id), 'cSw') + fld('Penghargaan', sel('cAw', AW.concat(['Kustom…']), AW[0], 'onchange="TX.certPrev()"'), 'cAw') + '<div class="fld hide" id="cAwK"><label for="cAwT">Nama penghargaan</label>' + inp('cAwT', '', 'maxlength="80"') + '</div>' + fld('Catatan (opsional)', '<textarea class="tta" id="cNote" maxlength="200" style="min-height:60px" placeholder="Atas dedikasi dan prestasi luar biasa…"></textarea>', 'cNote') + '<label style="display:flex;gap:8px;align-items:center;font-size:13px;margin-bottom:12px"><input type="checkbox" id="cMail"> Kirim PDF ke email siswa (jika tersedia)</label><div class="row g8 wrap"><button class="tb p" id="cGo" onclick="TX.certMake()">' + ico('workspace_premium', 18) + 'Buat Sertifikat</button><button class="tb" onclick="TX.certTop()">' + ico('podium', 18) + 'Buat untuk Juara 1–3</button></div></div>' +
    '<div class="tcard"><h3>Pratinjau</h3><p class="sub">Tampilan perkiraan</p><div id="cPrev" style="border:6px double #C9A227;border-radius:6px;padding:22px 12px;text-align:center;font-family:Georgia,serif;background:#fffdf4;color:#1A1A2E"></div></div></div><div class="tcard" style="margin-top:16px"><h3>Sertifikat terbit (' + certs.length + ')</h3><p class="sub">Klik Lihat untuk pratinjau PDF</p>' + (certs.length ? '<div class="twrap"><table class="tt"><thead><tr><th>Nomor</th><th>Siswa</th><th>Penghargaan</th><th>Tanggal</th><th></th></tr></thead><tbody>' + slice('cert', certs, 8).map(c => '<tr><td><code>' + esc(c.Nomor) + '</code></td><td>' + esc((TS.sm[c.IDSiswa] || {}).nama || c.IDSiswa) + '</td><td>' + esc(c.Penghargaan) + '</td><td>' + fmtDT(c.Tanggal) + '</td><td style="white-space:nowrap"><button class="tb sm" onclick="TX.certView(\'' + c.FileId + '\')">' + ico('visibility', 16) + 'Lihat</button> <a class="tb sm" href="https://drive.google.com/uc?export=download&id=' + esc(c.FileId) + '" target="_blank" rel="noopener">' + ico('download', 16) + 'Unduh</a></td></tr>').join('') + '</tbody></table>' + pager('cert', certs.length, 8) + '</div>' : empty('workspace_premium', 'Belum ada sertifikat.')) + '</div>';
  const pr = () => TX.certPrev(); $('#cSw').onchange = pr; $('#cAwT').oninput = pr; $('#cNote').oninput = pr; pr();
};
const awardName = () => val('cAw') === 'Kustom…' ? (val('cAwT') || 'Penghargaan') : val('cAw');
TX.certPrev = () => { const k = val('cAw') === 'Kustom…'; $('#cAwK').classList.toggle('hide', !k); const s = TS.sm[val('cSw')] || { nama: '-' }; $('#cPrev').innerHTML = '<div style="font-size:12px;letter-spacing:.12em;color:#1F3A5F;font-weight:700">' + esc((TS.b.cfg.sekolah || '').toUpperCase()) + '</div><div style="font-size:22px;font-weight:700;color:#1F3A5F;margin:6px 0">SERTIFIKAT APRESIASI</div><div style="font-size:12px;color:#64748B">diberikan kepada</div><div style="font-size:24px;font-weight:700;color:#2F80ED;margin:4px 0">' + esc(s.nama) + '</div><div style="font-size:12px;color:#64748B">sebagai</div><div style="font-size:18px;font-weight:700;color:#B8860B;margin:4px 0 8px">' + esc(awardName()) + '</div><div style="font-size:12px">' + esc(val('cNote') || 'Atas dedikasi dan prestasinya di EduVerse Kelas Baguyo') + '</div><div style="margin:12px auto 0;width:54px;height:54px;background:repeating-conic-gradient(#222 0 25%,#fff 0 50%) 0 0/12px 12px"></div><div style="font-size:10px;color:#64748B;margin-top:4px">QR verifikasi</div>'; };
async function certOne(sid, aw, note, mail) { const r = await apiT('apiCreateCert', { sid, penghargaan: aw, catatan: note, email: mail, fe: location.origin + location.pathname.replace(/\/[^\/]*$/, '') }); TS.b.certs.unshift(r); persistBoot(); return r; }
TX.certMake = async () => { const b = $('#cGo'); b.disabled = true; b.innerHTML = '<span class="spin"></span> Membuat…'; try { await certOne(val('cSw'), awardName(), val('cNote'), $('#cMail').checked); toast('Sertifikat berhasil dibuat', 'ok'); T.sertifikat(); } catch (e) { toast(e.message, 'er', 5000); b.disabled = false; b.innerHTML = ico('workspace_premium', 18) + 'Buat Sertifikat'; } };
TX.certTop = async () => { const st = clsStudents().slice().sort((a, b) => b.poin - a.poin).slice(0, 3); if (!st.length) return toast('Belum ada siswa', 'wa'); toast('Membuat ' + st.length + ' sertifikat… (± ' + st.length * 5 + ' dtk)', 'in', 4000); try { for (let i = 0; i < st.length; i++) await certOne(st[i].id, 'Juara ' + (i + 1) + ' Kelas', '', false); toast('Sertifikat juara selesai', 'ok'); T.sertifikat(); } catch (e) { toast(e.message, 'er', 5000); T.sertifikat(); } };
TX.certView = id => mOpen('Pratinjau Sertifikat', '<iframe src="https://drive.google.com/file/d/' + esc(id) + '/preview" style="width:100%;height:60vh;border:1px solid var(--t-bd);border-radius:8px" title="Sertifikat" allow="autoplay"></iframe>', '<button class="tb" onclick="mClose()">Tutup</button>', true);

/* ---------- Admin ---------- */
T.admin = function () {
  const us = TS.b.users || [], c = TS.b.cfg;
  $('#t-admin').innerHTML = ph('Administrasi', 'Admin Panel', 'Kelola akun guru/admin dan pengaturan aplikasi.', '<button class="tb p" onclick="TX.userForm()">' + ico('person_add') + 'Akun Baru</button>') + '<div class="grid g21"><div class="tcard"><h3>Akun guru &amp; admin</h3><p class="sub">Siswa masuk memakai kode kelas, tanpa akun.</p><div class="twrap"><table class="tt"><thead><tr><th>Nama</th><th>Username</th><th>Peran</th><th>Status</th><th></th></tr></thead><tbody>' + us.map(u => '<tr><td>' + esc(u.Nama) + '</td><td><code>' + esc(u.Username) + '</code></td><td>' + chipT(u.Peran, u.Peran === 'admin' ? 'bl' : '') + '</td><td>' + chipT(u.Status, u.Status === 'Aktif' ? 'ok' : u.Status === 'Menunggu' ? 'wa' : 'er') + '</td><td style="white-space:nowrap"><button class="tb sm ic" aria-label="Edit" onclick="TX.userForm(\'' + u.ID + '\')">' + ico('edit', 16) + '</button> <button class="tb sm ic d" aria-label="Hapus" onclick="TX.userDel(\'' + u.ID + '\')">' + ico('delete', 16) + '</button></td></tr>').join('') + '</tbody></table></div></div>' +
    '<div class="tcard"><h3>Pengaturan aplikasi</h3><p class="sub">Berlaku untuk semua pengguna</p>' + fld('Nama aplikasi', inp('cfN', c.appName, 'maxlength="80"'), 'cfN') + fld('Nama sekolah (di sertifikat)', inp('cfS', c.sekolah, 'maxlength="80"'), 'cfS') + fld('Kepala sekolah', inp('cfK', c.kepsek, 'maxlength="80"'), 'cfK') + '<div class="frow">' + fld('KKM default', inp('cfM', c.kkm, 'type="number" min="1" max="100"'), 'cfM') + fld('Interval sinkron (detik)', inp('cfY', c.syncSeconds, 'type="number" min="2" max="30"'), 'cfY') + fld('Level proctoring (1-5)', inp('cfP', c.proctoring, 'type="number" min="1" max="5"'), 'cfP') + '</div><p style="font-size:12px;color:var(--t-mu)">Interval lebih besar = hemat kuota runtime Apps Script (disarankan 4–6 dtk untuk akun gratis).</p><button class="tb p" onclick="TX.cfgSave()">Simpan Pengaturan</button></div></div>';
  adminReg();
};
/* ---------- Pendaftaran akun: persetujuan & pengaturan (admin) ---------- */
function adminReg() {
  const pend = (TS.b.users || []).filter(u => u.Status === 'Menunggu');
  const html = (pend.length ? '<div class="tcard" style="margin-bottom:16px;border-color:#F4B63D"><h3>' + ico('how_to_reg', 20) + ' Menunggu persetujuan (' + pend.length + ')</h3><p class="sub">Pendaftar baru tidak bisa masuk sebelum Anda setujui.</p><div class="twrap"><table class="tt"><thead><tr><th>Nama</th><th>Username</th><th>Peran</th><th>Email/NIP</th><th></th></tr></thead><tbody>' + pend.map(u => '<tr><td>' + esc(u.Nama) + '</td><td><code>' + esc(u.Username) + '</code></td><td>' + chipT(u.Peran, u.Peran === 'admin' ? 'bl' : '') + '</td><td>' + esc(u.NISN_Email || '-') + '</td><td style="white-space:nowrap"><button class="tb sm a" onclick="TX.userApprove(\'' + u.ID + '\',true)">' + ico('check', 16) + 'Setujui</button> <button class="tb sm d" onclick="TX.userApprove(\'' + u.ID + '\',false)">' + ico('close', 16) + 'Tolak</button></td></tr>').join('') + '</tbody></table></div></div>' : '') +
    '<div class="tcard" style="margin-bottom:16px" id="adReg"><h3>' + ico('how_to_reg', 20) + ' Pendaftaran akun guru &amp; admin</h3><p class="sub">Atur siapa yang boleh mendaftar sendiri lewat tab “Daftar Akun” di halaman Masuk Guru.</p><div class="frow">' +
    fld('Mode pendaftaran guru', sel('rgMode', [['persetujuan', 'Perlu persetujuan admin (disarankan)'], ['terbuka', 'Terbuka — langsung aktif'], ['tutup', 'Ditutup']], 'persetujuan'), 'rgMode') +
    fld('Kode pendaftaran guru <span id="rgCodeS" style="font-weight:400"></span>', '<div class="row g8"><input class="tin" id="rgCode" autocomplete="off" placeholder="Opsional — minta guru memasukkan kode ini"><button class="tb sm" type="button" onclick="TX.regRand(\'rgCode\',\'GURU\',8)">Acak</button></div>', 'rgCode') +
    fld('Kode admin <span id="rgAdmS" style="font-weight:400"></span>', '<div class="row g8"><input class="tin" id="rgAdm" autocomplete="off" placeholder="Wajib diatur agar admin baru bisa mendaftar"><button class="tb sm" type="button" onclick="TX.regRand(\'rgAdm\',\'ADM\',12)">Acak</button></div>', 'rgAdm') +
    '</div><p style="font-size:12px;color:var(--t-mu);margin:0 0 10px">Kode disimpan di server dan tidak ditampilkan lagi setelah disimpan — catat/salin sebelum menekan Simpan. Pendaftar tidak diverifikasi lewat email.</p><div class="row g8 wrap"><button class="tb p" onclick="TX.regSave()">Simpan pengaturan</button><button class="tb" id="rgClr1" onclick="TX.regClear(\'reg\')" disabled>Hapus kode guru</button><button class="tb" id="rgClr2" onclick="TX.regClear(\'admin\')" disabled>Hapus kode admin</button></div></div>';
  const g = $('#t-admin .grid.g21'); if (g) g.insertAdjacentHTML('beforebegin', html); TX.regLoad();
}
TX.regLoad = async () => { try { const s = await apiT('apiRegSettings'); if (!$('#rgMode')) return; $('#rgMode').value = s.mode; $('#rgCode').placeholder = s.hasCode ? '•••• tersimpan (isi untuk mengganti)' : 'Opsional — minta guru memasukkan kode ini'; $('#rgAdm').placeholder = s.hasAdminCode ? '•••• tersimpan (isi untuk mengganti)' : 'Wajib diatur agar admin baru bisa mendaftar'; $('#rgCodeS').textContent = s.hasCode ? '— aktif' : '— belum diatur'; $('#rgAdmS').textContent = s.hasAdminCode ? '— aktif' : '— belum diatur'; $('#rgClr1').disabled = !s.hasCode; $('#rgClr2').disabled = !s.hasAdminCode; } catch (e) { toast(e.message, 'er'); } };
TX.regRand = (id, p, n) => { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; const a = new Uint32Array(n); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => a[i] = Math.random() * 4e9); a.forEach(v => s += c[v % c.length]); $('#' + id).value = p + '-' + s; };
TX.regSave = async () => { try { await apiT('apiRegSave', { mode: val('rgMode'), regCode: val('rgCode').trim(), adminCode: val('rgAdm').trim() }); $('#rgCode').value = $('#rgAdm').value = ''; toast('Pengaturan pendaftaran tersimpan', 'ok'); TX.regLoad(); } catch (e) { toast(e.message, 'er', 5000); } };
TX.regClear = which => confirmDel('Hapus ' + (which === 'admin' ? 'Kode Admin? Admin baru tidak bisa mendaftar lagi' : 'Kode Pendaftaran Guru? Pendaftaran guru tidak lagi memerlukan kode') + '.', async () => { try { await apiT('apiRegSave', which === 'admin' ? { clearAdmin: true } : { clearReg: true }); toast('Kode dihapus', 'ok'); T.admin(); } catch (e) { toast(e.message, 'er'); } });
TX.userApprove = async (id, yes) => {
  const l = TS.b.users, i = l.findIndex(u => u.ID === id); if (i < 0) return; const prev = Object.assign({}, l[i]);
  if (yes) l[i].Status = 'Aktif'; else l.splice(i, 1); T.admin();
  try { await apiT('apiApproveUser', id, yes); toast(yes ? 'Akun ' + prev.Username + ' disetujui' : 'Pendaftaran ditolak', 'ok'); }
  catch (e) { if (yes) l[i].Status = prev.Status; else l.splice(i, 0, prev); T.admin(); toast(e.message, 'er'); }
};
TX.userForm = id => { const u = (TS.b.users || []).find(x => x.ID === id) || { Nama: '', Username: '', Peran: 'guru', Status: 'Aktif', NISN_Email: '' }; mOpen(id ? 'Edit Akun' : 'Akun Baru', fld('Nama lengkap', inp('uN', u.Nama, 'maxlength="60"'), 'uN') + '<div class="frow">' + fld('Username', inp('uU', u.Username, 'maxlength="30" autocapitalize="none"'), 'uU') + fld(id ? 'Password baru (kosongkan jika tetap)' : 'Password', inp('uP', '', 'type="password" autocomplete="new-password"'), 'uP') + '</div><div class="frow">' + fld('Peran', sel('uR', ['guru', 'admin'], u.Peran), 'uR') + fld('Status', sel('uS', ['Aktif', 'Nonaktif'], u.Status), 'uS') + fld('NIP / Email', inp('uE', u.NISN_Email, 'maxlength="80"'), 'uE') + '</div>', '<button class="tb" onclick="mClose()">Batal</button><button class="tb p" id="uGo" onclick="TX.userSave(\'' + (id || '') + '\')">Simpan</button>'); };
TX.userSave = async id => { const b = $('#uGo'); b.disabled = true; try { const r = await apiT('apiSaveUser', { ID: id, Nama: val('uN'), Username: val('uU'), Password: val('uP'), Peran: val('uR'), Status: val('uS'), NISN_Email: val('uE') }); const l = TS.b.users, i = l.findIndex(x => x.ID === r.ID); if (i >= 0) l[i] = r; else l.push(r); mClose(); T.admin(); toast('Akun tersimpan', 'ok'); } catch (e) { toast(e.message, 'er', 5000); b.disabled = false; } };
TX.userDel = id => confirmDel('Hapus akun ini?', async () => { try { await apiT('apiDelete', 'Pengguna', id); TS.b.users = TS.b.users.filter(u => u.ID !== id); T.admin(); toast('Akun dihapus', 'ok'); } catch (e) { toast(e.message, 'er'); } });
TX.cfgSave = async () => { try { TS.b.cfg = await apiT('apiSaveConfig', { appName: val('cfN'), sekolah: val('cfS'), kepsek: val('cfK'), kkm: val('cfM'), syncSeconds: val('cfY'), proctoring: val('cfP') }); toast('Pengaturan tersimpan', 'ok'); } catch (e) { toast(e.message, 'er'); } };

/* ---------- Objek Tch & inisialisasi ---------- */
let _bgT = 0;
const Tch = {
  enter(d, cached) {
    const role = d.user.peran === 'admin' ? 'admin' : 'guru'; saveSession(role, d.token, d.user, d.boot); TS.b = d.boot; TS.b.user = d.user; if (!cached) App.offset = d.boot.now - Date.now();
    $$('.sv').forEach(v => v.classList.remove('on')); document.body.classList.add('teacher'); $('#tapp').classList.add('on'); App.view = 'teacher'; tShell(); idx(); tGo(store.get('ev_tview', 'dashboard')); setSync(true);
    clearInterval(_bgT); _bgT = setInterval(() => { if (!document.hidden && TS.view !== 'cctv' && !$('#mov').classList.contains('on')) Tch.reload(false); }, 60000);
    if (!cached) toast('Selamat datang, ' + d.user.nama.split(',')[0] + '!', 'ok');
  },
  reload(manual) {
    return apiT('apiTeacherBoot').then(b => { TS.b = b; TS.bg = Date.now(); tKelasSel(); idx(); if (!$('#mov').classList.contains('on')) render(); setSync(true); persistBoot(); if (manual) toast('Data diperbarui', 'ok', 1500); }).catch(e => { setSync(false, e.net ? 'Offline' : 'Gagal'); if (manual) toast(e.message, 'er'); });
  },
  stop() { liveStop(); clearInterval(_bgT); $$('.tsec').forEach(s => s.innerHTML = ''); TS.b = null; TS.live = null; }
};

