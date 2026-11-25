
/* =====================================================================
   MODUL SISWA
   ===================================================================== */
const Stu = (() => {
  let B = null, syncT = 0, syncOn = false, A = null, seenMemo = '', seenWarn = '', joinMode = 'kode', joinAv = 0, others = [], profTab = 'nilai', rankTab = 'total', mapT = 0, bound = false;
  const sync = () => Math.max(2, (B && B.cfg && B.cfg.sync) || 4) * 1000;
  const L = i => String.fromCharCode(65 + i);
  const scCls = n => n >= 80 ? '' : n >= 60 ? 'mid' : 'low';

  /* ---------- Gabung kelas ---------- */
  function initJoin() {
    $('#heroBox').innerHTML = heroSVG();
    const otp = $('#otp'); otp.innerHTML = Array.from({ length: 6 }, (_, i) => '<input inputmode="text" maxlength="1" autocapitalize="characters" autocomplete="off" aria-label="Karakter kode ' + (i + 1) + '" data-i="' + i + '">').join('');
    const ins = $$('input', otp), code = () => ins.map(x => x.value).join('').toUpperCase();
    ins.forEach((el, i) => {
      el.addEventListener('input', () => { el.value = el.value.replace(/[^A-Za-z0-9]/g, '').slice(-1).toUpperCase(); el.classList.toggle('f', !!el.value); if (el.value && i < 5) ins[i + 1].focus(); });
      el.addEventListener('keydown', e => { if (e.key === 'Backspace' && !el.value && i > 0) { ins[i - 1].focus(); } if (e.key === 'ArrowLeft' && i > 0) ins[i - 1].focus(); if (e.key === 'ArrowRight' && i < 5) ins[i + 1].focus(); });
      el.addEventListener('paste', e => { e.preventDefault(); const t = ((e.clipboardData || window.clipboardData).getData('text') || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6); t.split('').forEach((c, k) => { ins[k].value = c; ins[k].classList.add('f'); }); (ins[Math.min(t.length, 5)]).focus(); });
    });
    $('#avGrid').innerHTML = AVATARS.map((a, i) => '<button type="button" class="avb' + (i === 0 ? ' on' : '') + '" role="radio" aria-checked="' + (i === 0) + '" aria-label="' + a.n + '" data-i="' + i + '">' + avatarSVG(i, 46) + '<span class="ck"><span class="material-symbols-outlined fill" style="font-size:16px">check</span></span></button>').join('');
    const pickAv = i => { joinAv = i; $$('.avb').forEach(b => { const on = +b.dataset.i === i; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); }); $('#avName').textContent = AVATARS[i].n; };
    $('#avGrid').addEventListener('click', e => { const b = e.target.closest('.avb'); if (b) pickAv(+b.dataset.i); });
    const last = store.get('ev_join', {}); if (last.nama) $('#joinNama').value = last.nama; if (last.av >= 0 && last.av != null) pickAv(last.av); else pickAv(0);
    const open = m => { joinMode = m; $('#codeWrap').classList.toggle('hide', m === 'mandiri'); $('#joinSub').textContent = m === 'mandiri' ? 'Belajar mandiri tanpa kode kelas — pilih nama & avatarmu' : 'Masukkan 6 digit kode kelas dari gurumu'; $('#joinErr').textContent = ''; showView('v-join'); setTimeout(() => (m === 'mandiri' ? $('#joinNama') : ins[code().length < 6 ? code().length : 0]).focus(), 60); };
    $('#btnKode').addEventListener('click', () => { if (last.kode) last.kode.split('').forEach((c, k) => { ins[k].value = c; ins[k].classList.add('f'); }); open('kode'); });
    $('#btnMandiri').addEventListener('click', () => open('mandiri'));
    $('#joinBack').addEventListener('click', () => showView('v-landing'));
    $('#btnGuru').addEventListener('click', () => { $('#tlogin').classList.add('on'); setTimeout(() => $('#tUser').focus(), 50); });
    $('#joinForm').addEventListener('submit', async e => {
      e.preventDefault(); const k = joinMode === 'mandiri' ? 'MANDIRI' : code(), nama = $('#joinNama').value.trim(), er = $('#joinErr');
      if (k.length !== 6 && joinMode !== 'mandiri') { er.textContent = 'Kode kelas harus 6 karakter.'; return; } if (nama.length < 2) { er.textContent = 'Isi nama panggilan (min. 2 huruf).'; $('#joinNama').focus(); return; }
      er.textContent = ''; const b = $('#joinGo'); b.disabled = true; $('#joinGoT').innerHTML = '<span class="spin"></span>';
      try { const d = await api('apiJoinClass', k, nama, joinAv, App.device); store.set('ev_join', { nama, av: joinAv, kode: joinMode === 'mandiri' ? (last.kode || '') : k }); enter(d); }
      catch (x) { er.textContent = x.message; } finally { b.disabled = false; $('#joinGoT').textContent = 'Masuk ke Dunia'; }
    });
  }

  /* ---------- Masuk dunia ---------- */
  function enter(d, cached) {
    saveSession('siswa', d.token, d.user, d.boot); B = d.boot; if (!cached) App.offset = B.now - Date.now();
    bindOnce(); World.reset(); showView('v-world'); hud();
    World.init().then(() => { World.setMe({ nama: B.user.nama, level: B.user.level, avatar: B.user.avatar }); World.setMissions(B.missions); if (App.view === 'v-world') World.start(); });
    if (!cached) toast('Selamat datang, ' + B.user.nama + '! 🎮', 'ok');
    syncOn = true; clearTimeout(syncT); loop(true);
  }
  function refresh(boot) { B = boot; App.offset = boot.now - Date.now(); store.set('ev_boot_siswa', boot); hud(); if (World.ok) World.setMissions(B.missions); }
  function hud() {
    const u = B.user; $('#hAv').innerHTML = avatarSVG(u.avatar, 34, '#2a2460'); $('#hName').textContent = u.nama; $('#hLv').textContent = 'Level ' + u.level + ' • ' + u.xp + '/' + u.xpNext + ' XP'; $('#hXp').style.width = Math.round(u.xp / u.xpNext * 100) + '%';
    World.setMe({ nama: u.nama, level: u.level, avatar: u.avatar });
    const ex = B.ujian.filter(x => x.status === 'berlangsung' && x.saya !== 'selesai')[0], ban = $('#examBan');
    ban.classList.toggle('hide', !ex || !!A); if (ex) { $('#examBanT').textContent = ex.jenis + ' “' + ex.judul + '” sedang berlangsung'; ban.dataset.id = ex.id; $('#examBanGo').textContent = ex.saya === 'berjalan' ? 'Lanjutkan' : 'Mulai'; }
    $('#bMisi').classList.toggle('nt', B.missions.some(m => m.status !== 'selesai') || !!ex);
  }
  function loop(first) {
    if (!syncOn) return;
    syncT = setTimeout(async () => {
      if (!syncOn) return;
      if (App.view !== 'v-ujian' && !document.hidden) { try { const s = World.state(); apply(await apiT('apiSync', { x: s.x, z: s.z, r: s.r, lv: B.user.level, a: A && A.mode === 'misi' ? 'misi:' + A.aid : 'dunia' })); } catch (e) { } }
      loop();
    }, first ? 600 : (document.hidden ? sync() * 3 : sync()));
  }
  function apply(d) {
    if (d.mv && B.mv && d.mv !== B.mv && !A) { B.mv = d.mv; apiT('apiStudentBoot').then(b => { if (!A) { refresh(b); toast('📌 Ada misi/ujian baru dari gurumu!', 'wa', 4000); } }).catch(() => { }); }
    others = d.others; World.setOthers(d.others); $('#hOnline').textContent = d.online + ' online'; App.offset = d.now - Date.now(); notices(d);
    let ch = false; (d.ex || []).forEach(e => { const u = B.ujian.find(x => x.id === e.id); if (u && u.status !== e.st) { if (e.st === 'berlangsung' && u.status === 'dijadwalkan') toast('📝 ' + u.jenis + ' “' + u.judul + '” sudah dimulai!', 'wa', 6000); u.status = e.st; ch = true; } }); if (ch) hud();
  }
  function notices(d) {
    if (d.memo && d.memo.id !== seenMemo) { seenMemo = d.memo.id; toast('📢 Guru: ' + d.memo.text, 'wa', 9000); }
    if (d.warn && d.warn.id !== seenWarn) { seenWarn = d.warn.id; toast('⚠️ Peringatan guru: ' + d.warn.text, 'er', 9000); }
  }

  /* ---------- Panel (sheet) ---------- */
  const head = (t, sub) => '<div class="grab"></div><div class="row between"><div><h2 style="margin:0;font-size:20px;font-weight:800">' + t + '</h2>' + (sub ? '<div class="mut" style="font-size:12px">' + sub + '</div>' : '') + '</div><button class="iconb" data-a="close" aria-label="Tutup"><span class="material-symbols-outlined">close</span></button></div>';
  function dist(m) { const s = SLOT[m.lokasi], p = World.pos(); return s ? Math.round(Math.hypot(s.x - p.x, s.z - p.z)) : 0; }
  function openMissions() {
    const ms = B.missions.map(m => { const d = dist(m), can = m.status !== 'selesai' && (d <= 12 || World.failed || (A && A.aid === m.aid));
      return '<div class="li"><div class="ic"><span class="material-symbols-outlined fill">' + (m.status === 'selesai' ? 'check_circle' : 'assignment') + '</span></div><div class="grow"><h4 class="ell">' + esc(m.judul) + '</h4><small>' + esc((SLOT[m.lokasi] || {}).nama || m.lokasi) + ' • ' + m.jml + ' soal • +' + m.hadiah + ' XP' + (m.status === 'selesai' ? ' • Nilai ' + num(m.nilai) : (World.failed ? '' : ' • ' + d + ' m')) + '</small></div>' +
        (m.status === 'selesai' ? '<button class="btnm" disabled>Selesai</button>' : '<button class="btnm" data-a="mis" data-id="' + m.aid + '"' + (can ? '' : ' disabled') + '>' + (can ? (m.status === 'berjalan' ? 'Lanjut' : 'Mulai') : 'Dekati') + '</button>') + '</div>'; }).join('') || '<p class="mut center">Belum ada misi dari gurumu.</p>';
    const ux = B.ujian.map(u => { let b; if (u.saya === 'selesai') b = '<span class="score ' + scCls(u.nilai) + '" style="font-size:15px">' + num(u.nilai) + '</span>'; else if (u.status === 'berlangsung') b = '<button class="btnm" data-a="ujian" data-id="' + u.id + '">' + (u.saya === 'berjalan' ? 'Lanjut' : 'Mulai') + '</button>'; else b = '<button class="btnm" disabled>' + ({ dijadwalkan: 'Belum mulai', jeda: 'Dijeda', ditutup: 'Ditutup', draft: 'Draft' }[u.status] || u.status) + '</button>';
      return '<div class="li"><div class="ic"><span class="material-symbols-outlined">' + (u.jenis === 'Latihan Harian' ? 'edit_note' : 'quiz') + '</span></div><div class="grow"><h4 class="ell">' + esc(u.judul) + '</h4><small>' + esc(u.jenis) + ' • ' + u.jml + ' soal • ' + u.durasi + ' mnt' + (u.mulai && u.status === 'dijadwalkan' ? ' • ' + fmtDT(u.mulai) : '') + '</small></div>' + b + '</div>'; }).join('');
    openSheet(head('Misi & Ujian', 'Kerjakan misi di kota atau ikuti ujian dari guru') + '<div class="eyebrow mt16">Misi di peta</div><div class="list-s">' + ms + '</div>' + (ux ? '<div class="eyebrow mt16">Ujian & latihan</div><div class="list-s">' + ux + '</div>' : ''));
  }
  function openFriends() {
    const rows = [{ n: B.user.nama, lv: B.user.level, av: B.user.avatar, me: 1 }].concat(others.map(o => ({ n: o.n, lv: o.lv, av: o.av })));
    openSheet(head('Teman Online', rows.length + ' sedang di dunia') + '<div class="list-s">' + rows.map(r => '<div class="li"><div class="ic" style="padding:0;overflow:hidden">' + avatarSVG(r.av, 30) + '</div><div class="grow"><h4>' + esc(r.n) + (r.me ? ' <span class="pillx xp" style="margin-left:4px">Kamu</span>' : '') + '</h4><small>Level ' + r.lv + '</small></div><span class="online" style="background:none;padding:0"><i></i></span></div>').join('') + '</div>');
  }
  function openCostume() {
    openSheet(head('Ganti Kostum', 'Pilih avatar baru') + '<div class="avgrid mt16">' + AVATARS.map((a, i) => '<button type="button" class="avb' + (i === B.user.avatar ? ' on' : '') + '" data-a="av" data-i="' + i + '" aria-label="' + a.n + '">' + avatarSVG(i, 46) + '<span class="ck"><span class="material-symbols-outlined fill" style="font-size:16px">check</span></span></button>').join('') + '</div>');
  }
  function openMap() {
    openSheet(head('Peta Mini', 'Titik kuning = misi, biru = kamu') + '<canvas class="minimap mt12" id="mm"></canvas>', () => clearInterval(mapT));
    const draw = () => { const cv = $('#mm'); if (!cv) return clearInterval(mapT); const p = World.pos(); drawCityMap(cv, [{ x: p.x, z: p.z, color: '#7cddff', r: 6, label: 'Kamu' }].concat(World.remotes().map(r => ({ x: r.x, z: r.z, color: '#ffb2ba', r: 4 }))), B.missions.map(m => ({ x: (SLOT[m.lokasi] || {}).x, z: (SLOT[m.lokasi] || {}).z, label: (SLOT[m.lokasi] || {}).nama, color: m.status === 'selesai' ? '#8ef0b1' : '#ffc83d' }))); };
    draw(); mapT = setInterval(draw, 800);
  }

  /* ---------- Percobaan (misi & ujian) ---------- */
  async function begin(aid, ms) {
    if (A && A.aid === aid) { return A.mode === 'misi' ? renderMission() : (showView('v-ujian'), renderExam()); }
    if (A) return toast('Selesaikan dulu asesmen yang sedang berjalan.', 'wa');
    openSheet('<div class="center" style="padding:36px 0"><span class="spin" style="width:34px;height:34px;color:var(--pri)"></span><p class="mut mt12">Menyiapkan soal…</p></div>'); $('#ov').dataset.lock = '1';
    try {
      const d = await apiT('apiStart', aid); App.offset = d.now - Date.now(); delete $('#ov').dataset.lock;
      const loc = store.get('ev_att_' + aid, {}), ans = Object.assign({}, d.jawab, loc.ans || {}), dirty = {}; Object.keys(ans).forEach(k => dirty[k] = 1);
      A = { aid, as: d.as, misi: d.misi, soal: d.soal, idx: 0, ans, dirty, endsAt: d.endsAt, paused: false, frozen: 0, events: loc.events || [], mode: d.as.jenis === 'Latihan Harian' ? 'misi' : 'ujian', locked: {}, finishing: !!loc.finishing, done: false, vio: 0, busy: false, last: {}, base: { w: innerWidth, h: innerHeight } };
      A.soal.forEach(q => { if (A.mode === 'misi' && ans[q.id] && String(ans[q.id].a).trim()) A.locked[q.id] = 1; });
      const f = A.soal.findIndex(q => !(A.ans[q.id] && String(A.ans[q.id].a).trim())); A.idx = f < 0 ? 0 : f;
      A.timer = setInterval(tick, 500); A.fl = setInterval(() => { if (!A.finishing) flush(false).catch(() => { }); }, 8000); if (A.mode === 'ujian') attachGuard();
      hud(); if (A.mode === 'misi') renderMission(); else { closeSheet(); showView('v-ujian'); renderExam(); }
      if (A.finishing) finish(true);
    } catch (e) { delete $('#ov').dataset.lock; closeSheet(); toast(e.message, 'er', 4500); if (e.code === 'SELESAI') apiT('apiStudentBoot').then(refresh).catch(() => { }); }
  }
  const remain = () => A.paused ? A.frozen : A.endsAt - (Date.now() + App.offset);
  function tick() {
    if (!A) return; const r = remain(), els = [$('#mTimer'), $('#xTimer')];
    els.forEach(el => { if (el) { el.textContent = mmss(r); el.parentElement.classList.toggle('low', r < 60000); } });
    if (r <= 0 && !A.finishing && !A.paused) { toast('⏰ Waktu habis, jawabanmu dikirim otomatis.', 'wa', 5000); finish(true); }
  }
  function persist() { if (A) store.set('ev_att_' + A.aid, { ans: A.ans, events: A.events, finishing: A.finishing }); }
  const soon = debounce(() => { if (A && !A.finishing) flush(false).catch(() => { }); }, 2500);
  function setAns(sid, v) { const o = A.ans[sid] || { a: '', r: 0 }; o.a = v; A.ans[sid] = o; A.dirty[sid] = 1; persist(); if (A.mode === 'ujian') soon(); }
  async function flush(final) {
    if (!A || (A.busy && !final)) return; while (A && A.busy) await new Promise(r => setTimeout(r, 200)); if (!A) return; A.busy = true;
    const ids = final ? Object.keys(A.ans) : Object.keys(A.dirty), answers = {}, snap = {}; ids.forEach(id => { if (A.ans[id]) { answers[id] = { a: A.ans[id].a, r: A.ans[id].r }; snap[id] = A.ans[id].a; } });
    const ev = A.events.splice(0, 40); const s = World.state();
    try {
      const r = await apiT('apiSubmit', { aid: A.aid, answers, ev, finish: !!final, x: s.x, z: s.z }); $('#netbar').style.display = 'none';
      Object.keys(snap).forEach(id => { if (A && A.ans[id] && A.ans[id].a === snap[id]) delete A.dirty[id]; });
      if (!A) return r; App.offset = r.now - Date.now(); A.endsAt = r.endsAt; notices(r);
      if (r.paused && !A.paused) { A.frozen = A.endsAt - (Date.now() + App.offset); A.paused = true; } else if (!r.paused && A.paused) A.paused = false;
      $('#exPause').classList.toggle('hide', !A.paused); if (r.hasil && !A.done) { A.done = true; A.result = r; }
      return r;
    } catch (e) { if (A) A.events.unshift(...ev); if (e.net) $('#netbar').style.display = 'block'; throw e; }
    finally { if (A) { A.busy = false; persist(); } }
  }

  /* --- penjaga integritas (hanya STS/SAS) --- */
  const KIND = { TAB_SWITCH: 'Berpindah tab', KELUAR_APLIKASI: 'Keluar dari aplikasi', SPLIT_SCREEN: 'Split screen terdeteksi', SALIN_TEKS: 'Menyalin/menyeleksi soal', TEMPEL: 'Menempel teks' };
  let guard = null;
  function ev(k, d) {
    if (!A || A.mode !== 'ujian' || A.finishing) return; const t = Date.now(); if (A.last[k] && t - A.last[k] < 1500) return; A.last[k] = t;
    A.events.push({ k, t, d: d || KIND[k] }); A.vio++; persist(); const b = $('#xVio'); if (b) b.textContent = ' • Pelanggaran tercatat: ' + A.vio;
    toast('Aktivitas tercatat: ' + KIND[k] + '. Tetap fokus pada ujian ya.', 'wa', 3500);
  }
  function attachGuard() {
    let splitOn = false; const typing = () => /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '');
    guard = {
      vis: () => { if (document.hidden) ev('TAB_SWITCH'); },
      blur: () => setTimeout(() => { if (A && !document.hidden && !document.hasFocus() && !typing()) ev('KELUAR_APLIKASI'); }, 450),
      rs: () => { if (!A) return; const w = innerWidth, h = innerHeight, sp = (w < A.base.w * .72 || h < A.base.h * .62) && !typing(); if (sp && !splitOn) { splitOn = true; ev('SPLIT_SCREEN'); } else if (!sp) splitOn = false; },
      cp: e => { if (App.view === 'v-ujian') { e.preventDefault(); ev('SALIN_TEKS'); } },
      ps: e => { if (App.view === 'v-ujian') { e.preventDefault(); ev('TEMPEL'); } }
    };
    document.addEventListener('visibilitychange', guard.vis); window.addEventListener('blur', guard.blur); window.addEventListener('resize', guard.rs);
    ['copy', 'cut', 'contextmenu', 'dragstart'].forEach(n => document.addEventListener(n, guard.cp)); document.addEventListener('paste', guard.ps);
  }
  function detachGuard() { if (!guard) return; document.removeEventListener('visibilitychange', guard.vis); window.removeEventListener('blur', guard.blur); window.removeEventListener('resize', guard.rs); ['copy', 'cut', 'contextmenu', 'dragstart'].forEach(n => document.removeEventListener(n, guard.cp)); document.removeEventListener('paste', guard.ps); guard = null; }

  /* --- tampilan soal --- */
  function qInput(q) {
    const a = (A.ans[q.id] || {}).a || '', lock = A.locked[q.id];
    if (q.jenis === 'Pilihan Ganda') return '<div class="opts">' + q.opsi.map((o, i) => '<button type="button" class="opt' + (a === o ? ' on' : '') + '" data-a="opt" data-i="' + i + '"' + (lock ? ' disabled' : '') + '><span class="k">' + L(i) + '</span><span class="grow">' + esc(o) + '</span>' + (a === o ? '<span class="material-symbols-outlined fill" style="color:var(--pri)">check_circle</span>' : '') + '</button>').join('') + '</div>';
    if (q.jenis === 'Isian Singkat') return '<div class="mt12"><input class="inp-s" data-in value="' + esc(a) + '" placeholder="Ketik jawabanmu…" autocomplete="off" autocapitalize="none"' + (lock ? ' disabled' : '') + '></div>';
    return '<div class="mt12"><textarea class="ta" data-in placeholder="Tulis jawaban uraianmu…"' + (lock ? ' disabled' : '') + '>' + esc(a) + '</textarea></div>';
  }
  function renderMission() {
    const q = A.soal[A.idx], n = A.soal.length, loc = A.misi && SLOT[A.misi.lokasi], last = A.idx === n - 1;
    openSheet('<div class="grab"></div><div class="row between wrap g8"><span class="pill" style="color:var(--on)"><span class="material-symbols-outlined fill" style="font-size:16px;color:var(--pri)">location_on</span>' + esc(loc ? loc.nama : 'Misi') + '</span><span class="pill" style="color:var(--tert-d)"><span class="material-symbols-outlined fill" style="font-size:16px">bolt</span>Soal ' + (A.idx + 1) + '/' + n + '</span></div>' +
      '<div class="row between g8 mt12"><div class="grow"><p class="eyebrow">Misi Aktif</p><h2 style="margin:2px 0 0;font-size:20px;line-height:26px;font-weight:800">' + esc(A.misi ? A.misi.judul : A.as.judul) + '</h2></div><div class="row g8"><span class="pillx xp"><span class="material-symbols-outlined fill" style="font-size:14px">stars</span>+' + (A.misi ? A.misi.hadiah : 0) + ' XP</span><span class="pillx tm"><span class="material-symbols-outlined" style="font-size:14px">timer</span><span id="mTimer">' + mmss(remain()) + '</span></span></div></div>' +
      '<div class="seg">' + A.soal.map((s, i) => '<i class="' + (i < A.idx || A.locked[s.id] ? 'on' : '') + '"></i>').join('') + '</div><div class="qbox">' + esc(q.teks) + '</div>' + qInput(q) +
      '<div class="acts2"><button class="btnq" data-a="mclose">Tutup</button><button class="btn3" data-a="msend"><span>' + (last ? 'Kirim & Selesai' : 'Kirim Jawaban') + '</span><span class="material-symbols-outlined">send</span></button></div>', () => { });
  }
  function mSend() {
    const q = A.soal[A.idx], a = ((A.ans[q.id] || {}).a || '').trim(); if (!a) return toast('Isi jawabanmu dulu ya.', 'wa', 1800);
    A.locked[q.id] = 1; persist(); if (A.idx < A.soal.length - 1) { A.idx++; renderMission(); flush(false).catch(() => { }); } else finish(true);
  }
  function renderExam() {
    if (!A) return; const q = A.soal[A.idx], n = A.soal.length, last = A.idx === n - 1, fl = (A.ans[q.id] || {}).r;
    $('#exTitle').textContent = 'Mode Asesmen';
    $('#exBody').innerHTML = '<div class="exhead"><div class="row g8 grow"><span class="tchip">' + esc(A.as.jenis) + '</span><b class="ell" style="font-size:16px">' + esc(A.as.judul) + '</b></div><span class="timer"><span class="material-symbols-outlined fill" style="font-size:18px">schedule</span><span id="xTimer">' + mmss(remain()) + '</span></span></div>' +
      '<div class="watch"><span class="material-symbols-outlined fill" style="font-size:18px">verified_user</span><span>Mode Pengawasan Aktif • Jangan keluar dari aplikasi<span id="xVio">' + (A.vio ? ' • Pelanggaran tercatat: ' + A.vio : '') + '</span></span></div>' +
      '<div class="navs" id="xNav">' + A.soal.map((s, i) => '<button type="button" class="nq' + ((A.ans[s.id] && String(A.ans[s.id].a).trim()) ? ' ans' : '') + (i === A.idx ? ' cur' : '') + '" data-a="nav" data-i="' + i + '" aria-label="Soal ' + (i + 1) + '">' + (i + 1) + ((A.ans[s.id] || {}).r ? '<span class="fl"><span class="material-symbols-outlined fill">flag</span></span>' : '') + '</button>').join('') + '</div>' +
      '<div class="qcard"><div class="qmeta"><span>Soal ' + (A.idx + 1) + ' dari ' + n + '</span><span>' + esc(q.mapel) + ' • ' + esc(q.jenis) + '</span></div><div class="qbox" style="background:none;padding:0">' + esc(q.teks) + '</div>' + qInput(q) + '</div>' +
      '<div class="exfoot"><button class="btnq iconb" style="flex:0 0 48px;width:48px" data-a="prev" aria-label="Sebelumnya"' + (A.idx ? '' : ' disabled') + '><span class="material-symbols-outlined">arrow_back</span></button><button class="btnq' + (fl ? ' on' : '') + '" data-a="flag"><span class="material-symbols-outlined' + (fl ? ' fill' : '') + '" style="font-size:20px">flag</span> Tandai Ragu</button><button class="btn3" data-a="next"><span>' + (last ? 'Kumpulkan' : 'Selanjutnya') + '</span><span class="material-symbols-outlined">' + (last ? 'done_all' : 'arrow_forward') + '</span></button></div>';
    const c = $('.nq.cur', $('#xNav')); if (c) c.scrollIntoView({ inline: 'center', block: 'nearest' }); $('#exPause').classList.toggle('hide', !A.paused);
  }
  async function finish(auto) {
    if (!A || A.finishing && !auto) return;
    if (!auto) {
      const un = A.soal.filter(q => !String((A.ans[q.id] || {}).a || '').trim()).length, fl = A.soal.filter(q => (A.ans[q.id] || {}).r).length;
      openSheet(head('Kumpulkan jawaban?') + '<p class="mut">' + (un ? '<b style="color:var(--sec)">' + un + ' soal belum dijawab.</b> ' : 'Semua soal sudah terjawab. ') + (fl ? fl + ' soal ditandai ragu. ' : '') + 'Setelah dikumpulkan, jawaban tidak bisa diubah.</p><div class="acts2"><button class="btnq" data-a="close">Periksa lagi</button><button class="btn3" data-a="fin"><span>Ya, kumpulkan</span></button></div>'); return;
    }
    A.finishing = true; persist(); if (A.mode === 'ujian') $('#exBody').innerHTML = '<div class="center" style="padding:80px 0"><span class="spin" style="width:38px;height:38px;color:var(--pri)"></span><p class="mut mt12">Mengirim jawabanmu…</p></div>'; else openSheet('<div class="center" style="padding:36px 0"><span class="spin" style="width:34px;height:34px;color:var(--pri)"></span><p class="mut mt12">Mengirim jawabanmu…</p></div>');
    $('#ov').dataset.lock = '1';
    for (let k = 0; k < 200; k++) {
      try { const r = await flush(true); if (r && r.hasil) { A.result = r; break; } } catch (e) { if (!e.net) { toast(e.message, 'er', 5000); if (e.code === 'MULAI' || e.code === 'SESI') break; } await new Promise(r => setTimeout(r, 3000)); if (!A) return; }
      if (A && A.result) break;
    }
    delete $('#ov').dataset.lock; if (A && A.result) done(A.result.hasil);
  }
  function done(h) {
    const a = A, mis = a.mode === 'misi'; clearInterval(a.timer); clearInterval(a.fl); detachGuard(); store.del('ev_att_' + a.aid); A = null;
    const m = B.missions.find(x => x.aid === a.aid), u = B.ujian.find(x => x.id === a.aid); if (m) { m.status = 'selesai'; m.nilai = h.nilai; } if (u) { u.saya = 'selesai'; u.nilai = h.nilai; }
    if (h.poin != null) { Object.assign(B.user, { poin: h.poin, level: h.level }); B.user.xp = h.poin % 200; }
    B.riwayat.unshift({ judul: a.as.judul, jenis: a.as.jenis, mapel: (a.soal[0] || {}).mapel || '', nilai: h.nilai, waktu: Date.now(), status: h.status });
    hud(); if (World.ok) World.setMissions(B.missions); store.set('ev_boot_siswa', B);
    const res = {}; (h.results || []).forEach(r => res[r.sid] = r);
    const detail = mis && h.results ? '<div class="list-s">' + a.soal.map((q, i) => { const r = res[q.id]; return '<div class="li"><div class="ic" style="color:' + (r && r.benar ? 'var(--ok)' : r && r.benar === false ? 'var(--err)' : 'var(--on-v)') + '"><span class="material-symbols-outlined fill">' + (r && r.benar ? 'check_circle' : r && r.benar === false ? 'cancel' : 'hourglass_top') + '</span></div><div class="grow"><h4 style="font-size:13px;line-height:18px">' + (i + 1) + '. ' + esc(q.teks).slice(0, 80) + (q.teks.length > 80 ? '…' : '') + '</h4>' + (r && r.benar === false ? '<small>Kunci: ' + esc(r.kunci) + '</small>' : '') + '</div></div>'; }).join('') + '</div>' : '';
    showView('v-world'); World.start();
    openSheet('<div class="grab"></div><div class="result"><span class="material-symbols-outlined fill" style="font-size:44px;color:' + (h.lulus ? 'var(--ok)' : 'var(--pri)') + '">' + (h.lulus ? 'emoji_events' : 'flag_circle') + '</span><h2 style="margin:6px 0 0;font-size:20px;font-weight:800">' + (h.status === 'Perlu Dinilai' ? 'Terkirim! Menunggu penilaian uraian' : h.lulus ? 'Hebat, kamu tuntas!' : 'Selesai, terus semangat!') + '</h2><div class="big ' + (h.lulus ? '' : 'bad') + '">' + num(h.nilai) + '</div><div class="mut">Nilai sementara • KKM ' + h.kkm + '</div></div>' +
      '<div class="rgrid"><div>Pilihan Ganda<b>' + h.pg[0] + '/' + h.pg[1] + '</b></div><div>Isian<b>' + h.isian[0] + '/' + h.isian[1] + '</b></div><div>Uraian<b>' + (h.status === 'Perlu Dinilai' ? 'Dinilai guru' : h.uraian[0] + '/' + h.uraian[1]) + '</b></div></div>' +
      '<div class="row between mt8"><span class="pillx xp"><span class="material-symbols-outlined fill" style="font-size:14px">stars</span>+' + (h.gain || 0) + ' XP</span><span class="mut" style="font-size:12px">Level ' + h.level + ' • ' + (h.poin || 0) + ' poin' + (!mis ? ' • Integritas ' + h.integritas + '%' : '') + '</span></div>' + (detail ? '<div class="mt12">' + detail + '</div>' : '') + '<div class="acts2"><button class="btn3" data-a="close"><span>Kembali ke Dunia</span></button></div>');
    apiT('apiStudentBoot').then(b => { if (!A) refresh(b); }).catch(() => { });
  }

  /* ---------- Profil & peringkat ---------- */
  function renderProfile() {
    const u = B.user; const col = $('#profBody .col') || $('#profBody');
    const tabs = '<div class="tabs" role="tablist"><button data-a="ptab" data-t="nilai" class="' + (profTab === 'nilai' ? 'on' : '') + '"><span class="material-symbols-outlined" style="font-size:20px;vertical-align:-5px">fact_check</span> Nilai Saya</button><button data-a="ptab" data-t="lencana" class="' + (profTab === 'lencana' ? 'on' : '') + '"><span class="material-symbols-outlined" style="font-size:20px;vertical-align:-5px">military_tech</span> Lencana</button></div>';
    const hist = '<div class="sec-h"><h3>Riwayat Nilai Terbaru</h3><span>' + B.riwayat.length + ' Aktivitas</span></div><div class="list-s">' + (B.riwayat.slice(0, 8).map(r => '<div class="li"><div class="ic"><span class="material-symbols-outlined">' + (r.jenis === 'STS' || r.jenis === 'SAS' ? 'calculate' : 'edit_note') + '</span></div><div class="grow"><h4 class="ell">' + esc(r.judul) + '</h4><small>' + (r.status === 'Perlu Dinilai' ? 'Menunggu nilai uraian' : 'Selesai') + ' • ' + relDay(r.waktu) + '</small></div><span class="score ' + scCls(r.nilai) + '">' + num(r.nilai, 0) + '</span></div>').join('') || '<p class="mut center" style="padding:20px">Belum ada nilai. Yuk kerjakan misi pertamamu!</p>') + '</div>';
    const open = B.lencana.filter(b => b.open).length, ic = { penjelajah: 'explore', rajin: 'local_fire_department', juara: 'emoji_events', jenius: 'psychology' };
    const bad = '<div class="sec-h"><h3>Koleksi Lencana</h3><span style="color:var(--pri)">' + open + ' / ' + B.lencana.length + ' Terbuka</span></div><div class="bgrid">' + B.lencana.map(b => '<div class="bd' + (b.open ? '' : ' lock') + '" title="' + esc(b.desk) + '"><div><span class="material-symbols-outlined fill" style="font-size:34px">' + ic[b.id] + '</span></div>' + esc(b.nama) + '</div>').join('') + '</div><div class="list-s mt12">' + B.lencana.map(b => '<div class="li"><div class="ic"><span class="material-symbols-outlined">' + (b.open ? 'check_circle' : 'lock') + '</span></div><div class="grow"><h4>' + esc(b.nama) + '</h4><small>' + esc(b.desk) + '</small></div></div>').join('') + '</div>';
    col.innerHTML = '<div class="pro"><div class="av">' + avatarSVG(u.avatar, 62) + '</div><div class="grow"><h2 class="ell">' + esc(u.nama) + '</h2><div class="row g8 wrap"><span class="lvl"><span class="material-symbols-outlined fill" style="font-size:16px">workspace_premium</span>Level ' + u.level + '</span><b style="color:var(--pri)"><span class="material-symbols-outlined fill" style="font-size:18px;vertical-align:-4px">stars</span> ' + num(u.poin, 0) + ' Poin</b></div></div></div>' +
      '<div class="row between mt12" style="font-size:12px;font-weight:600"><span class="mut">XP Menuju Level ' + (u.level + 1) + '</span><span style="color:var(--pri)">' + u.xp + ' / ' + u.xpNext + ' XP</span></div><div class="xpbar" style="height:12px;margin-top:6px"><i style="width:' + Math.round(u.xp / u.xpNext * 100) + '%"></i></div>' +
      tabs + (profTab === 'nilai' ? hist + bad : bad) + '<div class="row g8 mt24"><button class="btn2" data-a="costume"><span class="material-symbols-outlined">checkroom</span>Ganti Avatar</button></div>';
  }
  function renderRanks() {
    const list = B.lb[rankTab], me = list.findIndex(x => x.id === B.user.id) + 1, val = x => rankTab === 'total' ? x.poin : x.minggu, col = $('#ranksBody .col') || $('#ranksBody');
    const pod = (x, r) => x ? '<div class="pod r' + r + '"><div class="avs" style="width:' + (r === 1 ? 78 : 64) + 'px;height:' + (r === 1 ? 78 : 64) + 'px">' + avatarSVG(x.avatar, r === 1 ? 44 : 36) + '<span class="rk">#' + r + '</span></div><div class="stand" style="padding-top:' + (r === 1 ? 30 : 24) + 'px;min-height:' + (r === 1 ? 150 : r === 2 ? 118 : 104) + 'px"><b class="ell">' + esc(x.nama) + '</b><small>Lv ' + x.level + '</small><br><span class="xpp">' + num(val(x), 0) + ' XP</span></div></div>' : '<div></div>';
    const prev = store.get('ev_rank_' + B.user.id, 0), up = prev && me && prev > me ? prev - me : 0; if (rankTab === 'total' && me) store.set('ev_rank_' + B.user.id, me);
    const row = (x, i, self) => '<div class="lbr' + (self ? ' me' : '') + '"><span class="n">' + (i + 1) + '</span><div class="av">' + avatarSVG(x.avatar, 28) + '</div><div class="grow"><b class="ell" style="display:block">' + esc(x.nama) + (self ? ' <span class="pillx xp" style="margin-left:4px">Kamu</span>' : '') + '</b><small class="mut">Lv ' + x.level + (self && up ? ' • <span style="color:var(--tert-d)">Naik ' + up + ' peringkat!</span>' : '') + '</small></div><span class="xpp">' + num(val(x), 0) + ' XP</span></div>';
    col.innerHTML = '<div class="tabs"><button data-a="rtab" data-t="total" class="' + (rankTab === 'total' ? 'on' : '') + '"><span class="material-symbols-outlined" style="font-size:20px;vertical-align:-5px">groups</span> Kelas Ini</button><button data-a="rtab" data-t="minggu" class="' + (rankTab === 'minggu' ? 'on' : '') + '"><span class="material-symbols-outlined" style="font-size:20px;vertical-align:-5px">calendar_month</span> Minggu Ini</button></div>' +
      '<div class="podium">' + pod(list[1], 2) + pod(list[0], 1) + pod(list[2], 3) + '</div><div class="sec-h" style="margin-top:0"><h3 style="font-size:15px;color:var(--on-v)">Peringkat ' + esc(B.kelas.nama || 'Kelas') + '</h3><span style="color:var(--tert-d)"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:-3px">bolt</span> Live XP</span></div>' +
      list.slice(3, 30).map((x, i) => row(x, i + 3, x.id === B.user.id)).join('') + (me > 30 || (me && me <= 3) ? '' : '') + (me > 30 ? '<div style="position:sticky;bottom:0">' + row(list[me - 1], me - 1, true) + '</div>' : '') + (list.length ? '' : '<p class="mut center">Belum ada data.</p>');
  }
  function openRanks() { showView('v-ranks'); renderRanks(); apiT('apiLeaderboard').then(d => { B.lb = d.lb; if (App.view === 'v-ranks') renderRanks(); }).catch(() => { }); }
  function openProfile() { showView('v-profile'); renderProfile(); apiT('apiStudentBoot').then(b => { if (!A) { refresh(b); if (App.view === 'v-profile') renderProfile(); } }).catch(() => { }); }

  /* ---------- Event ---------- */
  function bindOnce() {
    if (bound) return; bound = true;
    World.onInteract(m => begin(m.aid, m));
    $('#bMisi').addEventListener('click', openMissions); $('#bFriends').addEventListener('click', openFriends); $('#bCostume').addEventListener('click', openCostume); $('#bMap').addEventListener('click', openMap);
    $('#bPause').addEventListener('click', () => { World.stop(); $('#pausePane').classList.remove('hide'); }); $('#pResume').addEventListener('click', () => { $('#pausePane').classList.add('hide'); World.start(); }); $('#pExit').addEventListener('click', () => { $('#pausePane').classList.add('hide'); logout(); });
    $('#examBanGo').addEventListener('click', () => begin($('#examBan').dataset.id)); $('#btnLogoutS').addEventListener('click', logout);
    $('#exBack').addEventListener('click', () => openSheet(head('Keluar dari ujian?') + '<p class="mut">Waktu ujian <b>tetap berjalan</b> dan keluar dari layar ujian akan tercatat. Yakin?</p><div class="acts2"><button class="btnq" data-a="close">Tetap di ujian</button><button class="btn3" data-a="leave"><span>Keluar sementara</span></button></div>'));
    $('#sheet').addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
      if (a === 'close') closeSheet(); else if (a === 'mis') begin(b.dataset.id); else if (a === 'ujian') { closeSheet(); begin(b.dataset.id); }
      else if (a === 'opt') { const q = A.soal[A.idx]; setAns(q.id, q.opsi[+b.dataset.i]); $$('.opt', $('#sheet')).forEach((o, i) => { o.classList.toggle('on', i === +b.dataset.i); }); }
      else if (a === 'msend') mSend(); else if (a === 'mclose') { closeSheet(); toast('Misi dijeda. Lanjutkan lewat tanda (!) atau panel Misi — waktu tetap berjalan.', 'in', 4500); }
      else if (a === 'fin') { closeSheet(); finish(true); } else if (a === 'leave') { closeSheet(); if (A) ev('KELUAR_APLIKASI', 'Keluar dari layar ujian'); showView('v-world'); World.start(); }
      else if (a === 'av') { const i = +b.dataset.i; B.user.avatar = i; hud(); closeSheet(); apiT('apiUpdateAvatar', i).catch(e => toast(e.message, 'er')); if (App.view === 'v-profile') renderProfile(); }
    });
    $('#sheet').addEventListener('input', e => { if (A && A.mode === 'misi' && e.target.matches('[data-in]')) setAns(A.soal[A.idx].id, e.target.value); });
    const ex = $('#exBody');
    ex.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b || !A) return; const a = b.dataset.a, q = A.soal[A.idx];
      if (a === 'opt') { setAns(q.id, q.opsi[+b.dataset.i]); renderExam(); } else if (a === 'nav') { A.idx = +b.dataset.i; renderExam(); }
      else if (a === 'next') { if (A.idx < A.soal.length - 1) { A.idx++; renderExam(); } else finish(false); } else if (a === 'prev') { A.idx = Math.max(0, A.idx - 1); renderExam(); }
      else if (a === 'flag') { const o = A.ans[q.id] || { a: '', r: 0 }; o.r = o.r ? 0 : 1; A.ans[q.id] = o; A.dirty[q.id] = 1; persist(); renderExam(); }
    });
    ex.addEventListener('input', e => { if (A && e.target.matches('[data-in]')) { const q = A.soal[A.idx]; setAns(q.id, e.target.value); const nb = $('.nq.cur', $('#xNav')); if (nb) nb.classList.toggle('ans', !!e.target.value.trim()); } });
    $('#profBody').addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b) return; if (b.dataset.a === 'ptab') { profTab = b.dataset.t; renderProfile(); } else if (b.dataset.a === 'costume') openCostume(); });
    $('#ranksBody').addEventListener('click', e => { const b = e.target.closest('[data-a="rtab"]'); if (b) { rankTab = b.dataset.t; renderRanks(); } });
    document.addEventListener('ev:view', e => { if (e.detail === 'v-world') { if (World.ok) World.start(); } else World.stop(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) World.stop(); else if (App.view === 'v-world' && $('#pausePane').classList.contains('hide')) World.start(); });
    document.addEventListener('ev:online', () => { if (A) flush(false).catch(() => { }); });
  }
  function stop() { syncOn = false; clearTimeout(syncT); if (A) { clearInterval(A.timer); clearInterval(A.fl); detachGuard(); A = null; } World.stop(); World.reset(); B = null; closeSheet(); }
  return { initJoin, enter, refresh, stop, openRanks, openProfile };
})();
