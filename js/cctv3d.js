/* =====================================================================
   CCTV LIVE 3D — mode pengawas (hanya-lihat).
   Memakai kota & avatar voxel yang SAMA dengan layar HP siswa (World.kit),
   sehingga guru melihat langsung apa yang dilihat siswa.
   Kamera: Overview (dari atas, bisa diputar/zoom) atau Ikuti siswa (sudut pandang seperti HP).
   ===================================================================== */
const Spec = (() => {
  let T = null, renderer = null, scene = null, cam = null, cv = null, ok = false, failed = false, running = false, raf = 0, last = 0, ro = null, pend = null;
  const rem = new Map(), tags = {}, mks = {}, ringM = {}, RC = { aman: 0x57d5fd, perhatian: 0xffc83d, pelanggaran: 0xff5c5c };
  let mode = 'over', followId = '', yaw = 0, zoom = 1, miss = [], drag = null;
  const ring = st => ringM[st] || (ringM[st] = new T.MeshBasicMaterial({ color: RC[st] || RC.aman, transparent: true, opacity: .8 }));

  async function mount() {
    cv = $('#cCanvas'); if (!cv) return false; running = false; if (raf) cancelAnimationFrame(raf); raf = 0;
    Object.keys(tags).forEach(k => delete tags[k]); Object.keys(mks).forEach(k => delete mks[k]);
    try { await World.kit.ensure(); T = window.THREE; } catch (e) { failed = true; return false; }
    try {
      if (renderer && renderer.dispose) { try { renderer.dispose(); } catch (e) { } }
      renderer = new T.WebGLRenderer({ canvas: cv, antialias: false, powerPreference: 'high-performance' }); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      if (!scene) {
        scene = new T.Scene(); scene.background = new T.Color(0x1a1250); scene.fog = new T.Fog(0x2a1d6e, 60, 190);
        scene.add(new T.HemisphereLight(0x9fb0ff, 0x2a2150, .95)); const dl = new T.DirectionalLight(0xbcc8ff, .55); dl.position.set(-30, 50, -20); scene.add(dl);
        World.kit.buildCity(scene, []); cam = new T.PerspectiveCamera(50, 1, .5, 500); cam.position.set(0, 62, 50);
      }
    } catch (e) { failed = true; return false; }
    ok = true; failed = false; bind(); resize(); if (pend) apply(); start(); return true;
  }
  function bind() {
    cv.addEventListener('pointerdown', e => { drag = e.clientX; try { cv.setPointerCapture(e.pointerId); } catch (x) { } cv.style.cursor = 'grabbing'; });
    cv.addEventListener('pointermove', e => { if (drag == null) return; yaw -= (e.clientX - drag) * .008; drag = e.clientX; });
    const up = () => { drag = null; cv.style.cursor = 'grab'; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.12 : .89); }, { passive: false });
    if (ro) ro.disconnect(); const host = $('#c3d'); if (host && window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(host); }
  }
  function resize() { if (!ok || !cv) return; const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  function start() { if (running || !ok) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function unmount() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; if (ro) { ro.disconnect(); ro = null; } }

  function setData(list, ms) { pend = { list, ms }; if (ok) apply(); }
  function apply() {
    const { list, ms } = pend, seen = {}; miss = ms || [];
    list.forEach(s => {
      if (!s.online) return; seen[s.id] = 1; let r = rem.get(s.id);
      if (!r) { const g = World.kit.makeAvatar(s.avatar), rg = new T.Mesh(new T.BoxGeometry(2.2, .05, 2.2), ring(s.status)); g.position.set(s.x, 0, s.z); rg.position.set(s.x, .12, s.z); scene.add(g); scene.add(rg); r = { g, rg, av: s.avatar, st: s.status }; rem.set(s.id, r); }
      if (r.av !== s.avatar) { const p = r.g.position.clone(); scene.remove(r.g); r.g = World.kit.makeAvatar(s.avatar); r.g.position.copy(p); scene.add(r.g); r.av = s.avatar; }
      if (r.st !== s.status) { r.rg.material = ring(s.status); r.st = s.status; }
      r.tx = s.x; r.tz = s.z; r.s = s;
    });
    rem.forEach((r, id) => { if (!seen[id]) { scene.remove(r.g); scene.remove(r.rg); rem.delete(id); if (tags[id]) { tags[id].remove(); delete tags[id]; } } });
    if (followId && !rem.has(followId)) { followId = ''; mode = 'over'; }
    const host = $('#cLabels'); if (host) { Object.keys(mks).forEach(k => { if (!miss.some(m => m.id === k)) { mks[k].remove(); delete mks[k]; } }); miss.forEach(m => { if (!mks[m.id]) { const e = document.createElement('div'); e.className = 'mk'; e.style.pointerEvents = 'none'; e.innerHTML = '<b>!</b><span></span>'; e.lastChild.textContent = (SLOT[m.lokasi] || {}).nama || m.lokasi; host.appendChild(e); mks[m.id] = e; } }); }
  }
  function label(id, text, cls) { let el = tags[id]; if (!el) { el = document.createElement('div'); el.className = 'tagp'; const h = $('#cLabels'); if (!h) return null; h.appendChild(el); tags[id] = el; } if (el._t !== text) { el.textContent = text; el._t = text; } if (el._c !== cls) { el.className = 'tagp ' + cls; el._c = cls; } return el; }
  function place(el, v, w, h) { v.project(cam); if (v.z > 1 || v.z < -1) { el.style.display = 'none'; return false; } el.style.display = ''; el.style.transform = 'translate3d(' + Math.round((v.x * .5 + .5) * w) + 'px,' + Math.round((-v.y * .5 + .5) * h) + 'px,0) translate(-50%,-100%)'; return true; }

  function frame(t) {
    raf = 0; if (!running || !cv || !cv.isConnected) return; raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (t - last) / 1000 || .016); last = t;
    rem.forEach(r => {
      const dx = r.tx - r.g.position.x, dz = r.tz - r.g.position.z, mv = Math.hypot(dx, dz) > .15, k = Math.min(1, dt * 3.2);
      r.g.position.x += dx * k; r.g.position.z += dz * k; if (mv) { let a = Math.atan2(dx, dz) - r.g.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); r.g.rotation.y += a * Math.min(1, dt * 10); }
      World.kit.animate(r.g, mv, dt); r.rg.position.set(r.g.position.x, .12, r.g.position.z);
    });
    const W = cv.clientWidth, H = cv.clientHeight, f = mode === 'follow' ? rem.get(followId) : null, k = Math.min(1, dt * 4.5); let px, py, pz, lx, ly, lz;
    if (f) { const D = (H > W ? 15 : 12) / Math.max(.7, zoom), hh = (H > W ? 11 : 9) / Math.max(.7, zoom), gx = f.g.position.x, gz = f.g.position.z; px = gx + Math.sin(yaw) * D; py = hh; pz = gz + Math.cos(yaw) * D; lx = gx; ly = 1.6; lz = gz; }
    else { const D = 50 / zoom, hh = 62 / zoom; px = Math.sin(yaw) * D; py = hh; pz = Math.cos(yaw) * D; lx = 0; ly = 0; lz = 0; }
    cam.position.x += (px - cam.position.x) * k; cam.position.y += (py - cam.position.y) * k; cam.position.z += (pz - cam.position.z) * k; cam.lookAt(lx, ly, lz);
    renderer.render(scene, cam);
    const v = new T.Vector3();
    rem.forEach((r, id) => { const s = r.s || {}, el = label(id, (s.nama || '').split(' ')[0] + (s.mode === 'ujian' ? ' • ' + s.done + '/' + s.total : ''), 's-' + (s.status || 'aman') + (id === followId ? ' sel' : '')); if (el) { v.set(r.g.position.x, 3.9, r.g.position.z); place(el, v, W, H); } });
    miss.forEach(m => { const s = SLOT[m.lokasi], el = mks[m.id]; if (s && el) { v.set(s.x, 5.2, s.z); place(el, v, W, H); } });
  }
  const zoomBy = f => { zoom = Math.max(.6, Math.min(2.4, zoom * f)); };
  return {
    mount, unmount, setData, zoomBy, start,
    follow(id) { if (id && rem.has(id)) { followId = id; mode = 'follow'; yaw = 0; } else { followId = ''; mode = 'over'; } },
    overview() { followId = ''; mode = 'over'; },
    reset() { followId = ''; mode = 'over'; yaw = 0; zoom = 1; },
    get mode() { return mode; }, get followId() { return followId; }, get ok() { return ok; }, get failed() { return failed; }, count: () => rem.size
  };
})();

/* ---------- Antarmuka CCTV 3D: HUD bergaya layar HP, chip siswa, layar penuh ---------- */
const RISK_ORD = { pelanggaran: 0, perhatian: 1, aman: 2 }, RISK_COL = { pelanggaran: '#ff5c5c', perhatian: '#ffc83d', aman: '#57d5fd' };
function c3dMarkup() {
  const b = (id, ic, label, on) => '<button class="hb glass" id="' + id + '" type="button" aria-label="' + label + '" title="' + label + '" onclick="' + on + '">' + ico(ic) + '</button>';
  return '<div class="c3d" id="c3d"><canvas id="cCanvas" aria-label="Tampilan 3D langsung kota EduVerse"></canvas><div class="wlabels" id="cLabels"></div><div class="hud2">' +
    '<div class="hudtop"><div class="pcard glass"><span class="material-symbols-outlined fill" style="color:var(--pri)">videocam</span><div class="grow"><b class="ell" id="cHk" style="display:block;font-size:14px">-</b><span class="ell" id="cHs" style="display:block;font-size:12px;color:var(--on-v)"></span></div></div>' +
    '<div class="hbtns">' + b('cbO', 'public', 'Overview kota', 'TX.sOver()') + b('cbF', 'person_pin_circle', 'Ikuti siswa', 'TX.sFollowFirst()') + b('cbP', 'add', 'Perbesar', 'TX.sZoom(1.2)') + b('cbM', 'remove', 'Perkecil', 'TX.sZoom(.83)') + b('cbR', 'center_focus_strong', 'Atur ulang kamera', 'TX.sReset()') + b('cbFs', 'fullscreen', 'Layar penuh', 'TX.cFull()') + '</div></div>' +
    '<div class="hudmid"><div class="hint glass" id="cHint"></div><div class="online glass"><i></i><span id="cHo">0 online</span></div></div><div class="cfeedfs glass" id="cFeedFs"></div><div class="cchips" id="cChips"></div></div></div>';
}
function radar2D(d) {
  const host = $('#cMatrix'); if (!host) return; host.innerHTML = '<canvas class="radar" id="cRadar"></canvas><p style="font-size:12px;color:var(--t-mu);margin:8px 0 0">Grafik 3D tidak tersedia di perangkat/jaringan ini — menampilkan peta 2D (biru aman, kuning perhatian, merah pelanggaran).</p>';
  drawCityMap($('#cRadar'), d.students.filter(x => x.online).map(x => ({ x: x.x, z: x.z, label: x.nama.split(' ')[0], r: 6, color: RISK_COL[x.status] })), MAP_SLOTS.map(s => ({ x: s.x, z: s.z, r: 4, color: '#555d78', label: '' })));
}
function cctv3d(d) {
  const host = $('#cMatrix'); if (!host) return;
  if (Spec.failed) return radar2D(d);
  if (!$('#c3d')) { host.innerHTML = c3dMarkup(); Spec.mount().then(ok => { if (!ok && $('#c3d') && TS.live) radar2D(TS.live); }); }
  const S = d.stats, aset = {}; TS.b.asesmen.forEach(a => { if (a.IDKelas === TS.kelas) aset[a.ID] = 1; });
  Spec.setData(d.students, TS.b.misi.filter(m => aset[m.IDAsesmen] && m.Status === 'Aktif').map(m => ({ id: m.ID, lokasi: m.Lokasi, judul: m.Judul })));
  const set = (id, v) => { const e = $('#' + id); if (e) e.textContent = v; }, fl = Spec.followId, nm = (TS.sm[fl] || {}).nama || '';
  set('cHk', (TS.cm[TS.kelas] || {}).NamaKelas || 'Kelas'); set('cHs', S.online + ' online • ' + S.anomali + ' anomali' + (d.as && d.as.status === 'Jeda' ? ' • ⏸ dijeda' : '')); set('cHo', S.online + ' online');
  set('cHint', fl ? '👁 Mengikuti ' + nm + ' — sudut pandang seperti layar HP siswa (seret untuk memutar)' : '💡 Seret untuk memutar • roda mouse atau tombol +/− untuk zoom • pilih nama di bawah untuk mengikuti siswa');
  const bo = $('#cbO'), bf = $('#cbF'); if (bo) bo.style.color = fl ? '' : 'var(--pri)'; if (bf) bf.style.color = fl ? 'var(--pri)' : '';
  const on = d.students.filter(x => x.online).sort((p, q) => RISK_ORD[p.status] - RISK_ORD[q.status] || p.nama.localeCompare(q.nama)), w = $('#cChips');
  if (w) { const sl = w.scrollLeft; w.innerHTML = on.length ? on.map(x => '<button type="button" class="cchip' + (x.id === fl ? ' sel' : '') + '" onclick="TX.sFollow(\'' + x.id + '\')"><span class="cav">' + avatarSVG(x.avatar, 16) + '</span><span class="dot2" style="background:' + RISK_COL[x.status] + '"></span>' + esc(x.nama.split(' ')[0]) + (x.mode === 'ujian' ? ' • ' + x.done + '/' + x.total : '') + '</button>').join('') : '<span class="cchip">Belum ada siswa online di kota</span>'; w.scrollLeft = sl; }
  const ff = $('#cFeedFs'); if (ff) ff.innerHTML = '<b>Anomali terbaru</b>' + (d.feed.length ? d.feed.slice(0, 6).map(e => '<div>' + fmtTm(e.t).slice(0, 5) + ' <b style="display:inline;font-size:12px">' + esc(e.nama.split(' ')[0]) + '</b> — ' + esc(e.d || e.k) + '</div>').join('') : '<div>Semua tertib ✅</div>');
}
const cctvRefresh = () => { if (TS.live && TS.mode === '3d') cctv3d(TS.live); };
TX.sOver = () => { Spec.overview(); cctvRefresh(); };
TX.sFollow = id => { Spec.follow(Spec.followId === id ? '' : id); cctvRefresh(); };
TX.sFollowFirst = () => { if (Spec.followId) return TX.sOver(); const f = TS.live && TS.live.students.filter(x => x.online).sort((p, q) => RISK_ORD[p.status] - RISK_ORD[q.status])[0]; if (!f) return toast('Belum ada siswa online', 'wa'); TX.sFollow(f.id); };
TX.sZoom = f => Spec.zoomBy(f); TX.sReset = () => { Spec.reset(); cctvRefresh(); };
TX.cFull = () => {
  const st = $('#cStage'); if (!st) return; const on = !st.classList.contains('cfull');
  if (on) { st.classList.add('cfull'); const el = document.documentElement, rq = el.requestFullscreen || el.webkitRequestFullscreen; if (rq && !document.fullscreenElement) { try { const p = rq.call(el); if (p && p.then) p.then(() => { TS.fsReal = true; }).catch(() => { }); } catch (e) { } } }
  else { st.classList.remove('cfull'); if (document.fullscreenElement && TS.fsReal) { TS.fsReal = false; try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) { } } }
  const fs = $('#cbFs'); if (fs) fs.innerHTML = ico(on ? 'fullscreen_exit' : 'fullscreen'); const b = $('#cFsBtn'); if (b) b.innerHTML = ico(on ? 'fullscreen_exit' : 'fullscreen', 18) + (on ? 'Keluar Layar Penuh' : 'Layar Penuh');
  setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
};
function exitCctvFs() { TS.fsReal = false; if (document.fullscreenElement) { try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) { } } Spec.unmount(); }
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && TS.fsReal) { TS.fsReal = false; const st = $('#cStage'); if (st && st.classList.contains('cfull')) TX.cFull(); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#mov').classList.contains('on')) { const st = $('#cStage'); if (st && st.classList.contains('cfull')) TX.cFull(); } });
