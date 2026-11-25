
/* =====================================================================
   DUNIA 3D VOXEL — satu draw-call untuk seluruh kota (geometri digabung).
   Pemain lain disinkron lewat polling + interpolasi halus.
   ===================================================================== */
const World = (() => {
  let T = null, renderer, scene, camera, canvas, me, raf = 0, running = false, last = 0, ok = false, failed = false, ready = null;
  const remotes = new Map(), colliders = [], tags = {}, markers = {}, plates = [], geoC = {}, matC = {};
  const inp = { x: 0, y: 0, keys: {}, jump: false }, st = { x: 0, z: 9, r: Math.PI, vy: 0, y: 0, moving: false };
  let missions = [], near = null, onInteract = null, meInfo = { nama: '-', level: 1, avatar: 0 }, slowFrames = 0, dprLow = false;
  const SPEED = 7.2;

  function Mesher() {
    const P = [], N = [], C = [], F = [[[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1], 1, 0, 0], [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0], -1, 0, 0], [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0], 0, 1, 0], [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1], 0, -1, 0], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1], 0, 0, 1], [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0], 0, 0, -1]];
    return {
      box(cx, y0, cz, w, h, d, hex) {
        const c = new T.Color(hex), x0 = cx - w / 2, z0 = cz - d / 2;
        F.forEach(f => { const v = f.slice(0, 4).map(o => [x0 + o[0] * w, y0 + o[1] * h, z0 + o[2] * d]); [0, 1, 2, 0, 2, 3].forEach(i => { P.push(v[i][0], v[i][1], v[i][2]); N.push(f[4], f[5], f[6]); C.push(c.r, c.g, c.b); }); });
      },
      mesh(mat) { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T.Float32BufferAttribute(C, 3)); return new T.Mesh(g, mat); }
    };
  }

  function buildCity() {
    const L = Mesher(), B = Mesher(); let rs = 11; const rnd = () => (rs = (rs * 9301 + 49297) % 233280) / 233280;
    L.box(0, -0.6, 0, 100, 0.6, 100, '#2f8f4a');                          // rumput
    L.box(0, 0, -4, 8, 0.05, 52, '#353847'); L.box(0, 0, 0, 60, 0.05, 8, '#353847'); // jalan
    L.box(0, 0.06, -4, 8, 0.01, 52, '#353847');
    [[-6, 0, 2, 60], [6, 0, 2, 60]].forEach(s => L.box(s[0], 0, s[1], 0.1, 0.01, 0.1, '#fff'));
    for (let x = -28; x <= 28; x += 2) { L.box(x, 0.12, -5, 2, 0.14, 2, '#8e8ea5'); L.box(x, 0.12, 5, 2, 0.14, 2, '#8e8ea5'); }
    for (let z = -28; z <= 20; z += 2) { L.box(-5, 0.12, z, 2, 0.14, 2, '#8e8ea5'); L.box(5, 0.12, z, 2, 0.14, 2, '#8e8ea5'); }
    for (let x = -28; x <= 28; x += 4) B.box(x, 0.07, 0, 1.8, 0.02, 0.3, '#ddd');
    for (let z = -28; z <= 20; z += 4) B.box(0, 0.07, z, 0.3, 0.02, 1.8, '#ddd');
    const bld = (cx, cz, w, d, h, col, roof, front, tag) => {
      L.box(cx, 0, cz, w, h, d, col); L.box(cx, h, cz, w + 0.6, 0.5, d + 0.6, roof);
      colliders.push({ x0: cx - w / 2 - .5, x1: cx + w / 2 + .5, z0: cz - d / 2 - .5, z1: cz + d / 2 + .5 });
      const horiz = front[1] !== 0, n = Math.max(2, Math.floor((horiz ? w : d) / 2.4)), rows = Math.max(1, Math.floor((h - 1.2) / 2.2));
      for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) {
        const t = (i + 0.5) / n - 0.5, y = 1.8 + j * 2.2, lit = rnd() > .3 ? '#ffd86b' : '#27305c';
        if (horiz) B.box(cx + t * (w - 1), y, cz + front[1] * (d / 2 + 0.04), 1, 1.1, 0.1, lit); else B.box(cx + front[0] * (w / 2 + 0.04), y, cz + t * (d - 1), 0.1, 1.1, 1, lit);
      }
      if (horiz) { B.box(cx, 0, cz + front[1] * (d / 2 + 0.05), 1.6, 2, 0.1, '#ffb347'); B.box(cx, h - 0.3, cz + front[1] * (d / 2 + 0.2), Math.min(w - 1, 6), 0.8, 0.2, tag || '#ffeaa0'); }
      else { B.box(cx + front[0] * (w / 2 + 0.05), 0, cz, 0.1, 2, 1.6, '#ffb347'); }
    };
    bld(-16, -13, 10, 8, 6, '#58708f', '#2e3d55', [0, 1], '#9fd8ff'); bld(16, -13, 14, 8, 8, '#a8503f', '#5b2a22', [0, 1], '#ffe28a');
    bld(-16, 13, 8, 7, 5, '#e08a3c', '#8a4a1a', [0, -1], '#ff6b5e'); bld(16, 13, 6, 6, 5, '#7a7fa3', '#3b3e5c', [0, -1]);
    L.box(16, 5, 13, 3, 8, 3, '#c9c4e8'); L.box(16, 13, 13, 4, 2.4, 4, '#f4f0ff'); B.box(16, 14, 13 - 2.05, 1.8, 1.8, 0.1, '#fff6c8'); colliders.push({ x0: 13, x1: 19, z0: 10, z1: 16 });
    bld(0, -34, 16, 6, 8, '#b9b2d6', '#4a4470', [0, 1], '#ffe28a'); bld(-34, 0, 6, 12, 6, '#3f9a8a', '#1f5249', [1, 0]); bld(34, 0, 6, 14, 5, '#5e7bd6', '#27396b', [-1, 0]);
    [[-24, -14, '#d46a6a'], [-24, 10, '#6aa5d4'], [24, -14, '#d4b36a'], [24, 12, '#8ad46a'], [-10, -20, '#a46ad4'], [10, -22, '#6ad4c0'], [-12, 24, '#d46aa0'], [12, 26, '#d4a46a']].forEach(h => { L.box(h[0], 0, h[1], 4, 3, 4, h[2]); L.box(h[0], 3, h[1], 4.6, 0.5, 4.6, '#47321f'); L.box(h[0], 3.5, h[1], 3, 1, 3, '#5a4028'); B.box(h[0], 1.2, h[1] + 2.04, 1, 1, 0.1, '#ffd86b'); colliders.push({ x0: h[0] - 2.5, x1: h[0] + 2.5, z0: h[1] - 2.5, z1: h[1] + 2.5 }); });
    for (let i = 0; i < 46; i++) { const x = (rnd() - .5) * 74, z = (rnd() - .5) * 74; if (Math.abs(x) < 8 || Math.abs(z) < 8 || colliders.some(c => x > c.x0 - 2 && x < c.x1 + 2 && z > c.z0 - 2 && z < c.z1 + 2) || (Math.abs(x) > 30 && Math.abs(z) < 12) || z < -29 && Math.abs(x) < 12) continue; L.box(x, 0, z, .5, 1.6, .5, '#6b4a2b'); L.box(x, 1.6, z, 2.4, 2, 2.4, '#2fa64f'); L.box(x, 3.6, z, 1.5, 1.2, 1.5, '#4fcf6e'); }
    for (let k = -3; k <= 3; k++) { if (!k) continue; [-1, 1].forEach(sd => { L.box(k * 9, 0, sd * 5.8, .2, 4.5, .2, '#3a3a52'); B.box(k * 9, 4.4, sd * 5.8, .8, .45, .8, '#ffe9a0'); }); }
    L.box(0, 0, 27, 5, .6, 5, '#9a9ab5'); L.box(0, .6, 27, 1, 2.2, 1, '#c8c8e0'); B.box(0, .62, 27, 4, .05, 4, '#7cddff'); colliders.push({ x0: -3, x1: 3, z0: 24.5, z1: 29.5 });
    const lit = L.mesh(new T.MeshLambertMaterial({ vertexColors: true })), glow = B.mesh(new T.MeshBasicMaterial({ vertexColors: true }));
    scene.add(lit, glow);
    const sp = new Float32Array(240 * 3); for (let i = 0; i < 240; i++) { const a = rnd() * 6.283, e = .15 + rnd() * 1.2, r = 150; sp[i * 3] = Math.cos(a) * Math.cos(e) * r; sp[i * 3 + 1] = Math.sin(e) * r; sp[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r; }
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3)); scene.add(new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 1.6, fog: false })));
    const moon = new T.Mesh(new T.SphereGeometry(7, 16, 12), new T.MeshBasicMaterial({ color: 0xfff6c8, fog: false })); moon.position.set(-60, 80, -120); scene.add(moon);
  }

  const mat = c => matC[c] || (matC[c] = new T.MeshLambertMaterial({ color: c }));
  const geo = (w, h, d) => { const k = w + '_' + h + '_' + d; return geoC[k] || (geoC[k] = new T.BoxGeometry(w, h, d)); };
  function part(g, w, h, d, x, y, z, col, op) { const m = new T.Mesh(geo(w, h, d), op ? new T.MeshLambertMaterial({ color: col, transparent: true, opacity: op }) : mat(col)); m.position.set(x, y, z); g.add(m); return m; }
  function makeAvatar(i) {
    const a = AVATARS[(i | 0) % 8], g = new T.Group(), body = new T.Group(); g.add(body);
    const legL = new T.Group(), legR = new T.Group(), armL = new T.Group(), armR = new T.Group();
    legL.position.set(-.28, .9, 0); legR.position.set(.28, .9, 0); armL.position.set(-.76, 2, 0); armR.position.set(.76, 2, 0);
    part(legL, .46, .9, .5, 0, -.45, 0, a.pants); part(legR, .46, .9, .5, 0, -.45, 0, a.pants); part(legL, .5, .2, .6, 0, -.8, .05, '#1b1b2f'); part(legR, .5, .2, .6, 0, -.8, .05, '#1b1b2f');
    part(armL, .36, 1, .4, 0, -.5, 0, a.skin); part(armR, .36, 1, .4, 0, -.5, 0, a.skin);
    body.add(legL, legR, armL, armR); part(body, 1.1, 1.1, .6, 0, 1.45, 0, a.shirt);
    part(body, .95, .95, .95, 0, 2.5, 0, a.skin); part(body, 1.02, .3, 1.02, 0, 3.08, 0, a.hair); part(body, .12, .12, .05, -.22, 2.55, .48, '#1b1b2f'); part(body, .12, .12, .05, .22, 2.55, .48, '#1b1b2f');
    if (a.acc === 'helm') part(body, 1.3, 1.3, 1.3, 0, 2.55, 0, a.c, .32); else if (a.acc === 'antena') { part(body, .12, .5, .12, 0, 3.4, 0, '#f2f4ff'); part(body, .3, .3, .3, 0, 3.75, 0, a.c); }
    else if (a.acc === 'telinga') { part(body, .3, .35, .2, -.3, 3.35, 0, a.c); part(body, .3, .35, .2, .3, 3.35, 0, a.c); } else if (a.acc === 'topi') { part(body, 1.5, .1, 1.5, 0, 3.15, 0, a.c); part(body, .9, .6, .9, 0, 3.5, 0, a.c); part(body, .5, .5, .5, 0, 4, 0, a.c); }
    else if (a.acc === 'duri') { [-.25, .25].forEach(x => part(body, .2, .3, .2, x, 3.3, 0, a.c)); part(body, .2, .45, .2, 0, 3.4, 0, a.c); } else if (a.acc === 'ikat') part(body, 1, .16, 1, 0, 2.7, 0, a.c);
    else if (a.acc === 'syal') { part(body, 1.2, .25, .7, 0, 2.05, 0, a.c); part(body, .25, .8, .1, .35, 1.6, .38, a.c); } else if (a.acc === 'ekor') part(body, .35, .35, .9, 0, 1, -.7, a.c);
    g.userData = { legL, legR, armL, armR, body, ph: Math.random() * 6 }; g.scale.setScalar(.85); return g;
  }
  function animate(g, moving, dt) {
    const u = g.userData; u.ph += dt * (moving ? 11 : 0); const s = moving ? Math.sin(u.ph) * .85 : 0;
    u.legL.rotation.x = s; u.legR.rotation.x = -s; u.armL.rotation.x = -s; u.armR.rotation.x = s; u.body.position.y = moving ? Math.abs(Math.sin(u.ph)) * .12 : Math.sin(performance.now() / 600 + u.ph) * .03;
  }

  function label(id, text, cls) { let el = tags[id]; if (!el) { el = document.createElement('div'); el.className = 'tagp ' + (cls || ''); $('#wlabels').appendChild(el); tags[id] = el; } if (el._t !== text) { el.textContent = text; el._t = text; } return el; }
  function place(el, v, w, h, off) { v.project(camera); if (v.z > 1 || v.z < -1) { el.style.display = 'none'; return false; } el.style.display = ''; el.style.transform = 'translate3d(' + Math.round((v.x * .5 + .5) * w) + 'px,' + Math.round((-v.y * .5 + .5) * h + (off || 0)) + 'px,0) translate(-50%,-100%)'; return true; }

  function collide(x, z) {
    for (const c of colliders) {
      if (x > c.x0 - .45 && x < c.x1 + .45 && z > c.z0 - .45 && z < c.z1 + .45) {
        const dx = Math.min(x - (c.x0 - .45), c.x1 + .45 - x), dz = Math.min(z - (c.z0 - .45), c.z1 + .45 - z);
        if (dx < dz) x = (x - c.x0 < c.x1 - x) ? c.x0 - .45 : c.x1 + .45; else z = (z - c.z0 < c.z1 - z) ? c.z0 - .45 : c.z1 + .45;
      }
    }
    return [clamp(x, -36, 36), clamp(z, -36, 36)];
  }

  function frame(t) {
    raf = 0; if (!running) return; raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (t - last) / 1000 || .016); last = t;
    if (dt > .034) { if (++slowFrames > 50 && !dprLow) { dprLow = true; renderer.setPixelRatio(1); resize(); } } else slowFrames = Math.max(0, slowFrames - 1);
    let ix = inp.x, iy = inp.y; const k = inp.keys;
    if (k.ArrowLeft || k.a) ix -= 1; if (k.ArrowRight || k.d) ix += 1; if (k.ArrowUp || k.w) iy -= 1; if (k.ArrowDown || k.s) iy += 1;
    const m = Math.hypot(ix, iy); st.moving = m > .12;
    if (st.moving) { const f = Math.min(1, m); ix /= m; iy /= m; const nx = st.x + ix * SPEED * f * dt, nz = st.z + iy * SPEED * f * dt; [st.x, st.z] = collide(nx, nz); st.r = Math.atan2(ix, iy); }
    if (inp.jump && st.y <= 0.001) { st.vy = 7.5; inp.jump = false; } st.vy -= 20 * dt; st.y = Math.max(0, st.y + st.vy * dt); if (st.y === 0 && st.vy < 0) st.vy = 0;
    me.position.set(st.x, st.y, st.z); let dr = st.r - me.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); me.rotation.y += dr * Math.min(1, dt * 14); animate(me, st.moving && st.y < .05, dt);
    remotes.forEach(r => { const dx = r.tx - r.g.position.x, dz = r.tz - r.g.position.z, d = Math.hypot(dx, dz), mv = d > .15; r.g.position.x += dx * Math.min(1, dt * 3.2); r.g.position.z += dz * Math.min(1, dt * 3.2); if (mv) { let a = Math.atan2(dx, dz) - r.g.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); r.g.rotation.y += a * Math.min(1, dt * 10); } animate(r.g, mv, dt); });
    const W = canvas.clientWidth, H = canvas.clientHeight, portrait = H > W, dist = portrait ? 15 : 12, hgt = portrait ? 11 : 9;
    camera.position.x += (st.x - camera.position.x) * Math.min(1, dt * 6); camera.position.z += (st.z + dist - camera.position.z) * Math.min(1, dt * 6); camera.position.y += (hgt - camera.position.y) * Math.min(1, dt * 4);
    camera.lookAt(camera.position.x, 1.5, st.z - 1.5);
    renderer.render(scene, camera);
    // label & marker (DOM overlay)
    const v = new T.Vector3(); v.set(st.x, 3.9, st.z); place(label('me', meInfo.nama + ' • Lv ' + meInfo.level, 'me'), v, W, H);
    const arr = []; remotes.forEach((r, id) => arr.push([id, r, Math.hypot(r.g.position.x - st.x, r.g.position.z - st.z)])); arr.sort((a, b) => a[2] - b[2]);
    arr.forEach((a, i) => { const el = label(a[0], a[1].text); if (i < 12 && a[2] < 34) { v.set(a[1].g.position.x, 3.9, a[1].g.position.z); place(el, v, W, H); } else el.style.display = 'none'; });
    let nm = null, nd = 1e9;
    missions.forEach(ms => { const s = SLOT[ms.lokasi]; if (!s) return; const d = Math.hypot(s.x - st.x, s.z - st.z), el = markers[ms.id]; if (!el) return; v.set(s.x, 5.2, s.z); if (place(el, v, W, H)) { el.lastChild.textContent = ms.status === 'selesai' ? 'Selesai' : Math.round(d) + 'm'; } if (ms.status !== 'selesai' && d < nd) { nd = d; nm = ms; } });
    const was = near; near = nd < 6 ? nm : null; if (was !== near) { $('#bAct').classList.toggle('near', !!near); $('#hHint').textContent = near ? '📍 ' + near.judul + ' — tekan Interaksi untuk mulai!' : '💡 Dekati tanda seru kuning (!) untuk mulai misi soal!'; }
    plates.forEach(p => { p.material.opacity = .35 + Math.sin(t / 300) * .15; });
  }

  function resize() { if (!ok) return; const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }

  function initInput() {
    const j = $('#joy'), k = $('#joyK'); let act = false, pid = null;
    const mv = e => { const r = j.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let dx = e.clientX - cx, dy = e.clientY - cy; const m = Math.hypot(dx, dy), mx = r.width * .36; if (m > mx) { dx *= mx / m; dy *= mx / m; } k.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; inp.x = dx / mx; inp.y = dy / mx; };
    j.addEventListener('pointerdown', e => { act = true; pid = e.pointerId; j.setPointerCapture(pid); mv(e); e.preventDefault(); });
    j.addEventListener('pointermove', e => { if (act && e.pointerId === pid) mv(e); });
    const rs = () => { act = false; inp.x = inp.y = 0; k.style.transform = ''; }; j.addEventListener('pointerup', rs); j.addEventListener('pointercancel', rs);
    $('#bJump').addEventListener('click', () => { inp.jump = true; });
    $('#bAct').addEventListener('click', () => interact());
    window.addEventListener('keydown', e => { if (App.view !== 'v-world' || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '') || $('#ov').classList.contains('on')) return; const kk = e.key.length === 1 ? e.key.toLowerCase() : e.key; if ('wasd'.includes(kk) && kk.length === 1 || kk.startsWith('Arrow')) { inp.keys[kk] = true; e.preventDefault(); } else if (kk === ' ') { inp.jump = true; e.preventDefault(); } else if (kk === 'e' || kk === 'Enter') interact(); });
    window.addEventListener('keyup', e => { const kk = e.key.length === 1 ? e.key.toLowerCase() : e.key; delete inp.keys[kk]; });
    window.addEventListener('blur', () => { inp.keys = {}; });
    new ResizeObserver(resize).observe($('#v-world'));
  }
  const interact = () => { if (near && onInteract) onInteract(near); else toast('Dekati tanda seru kuning (!) dulu ya.', 'in', 1800); };

  async function init() {
    if (ready) return ready;
    return ready = (async () => {
      canvas = $('#world'); initInput();
      try {
        await LIB.three(); T = window.THREE;
        renderer = new T.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        scene = new T.Scene(); scene.background = new T.Color(0x1a1250); scene.fog = new T.Fog(0x2a1d6e, 40, 95);
        camera = new T.PerspectiveCamera(55, 1, .5, 400); camera.position.set(0, 9, 22);
        scene.add(new T.HemisphereLight(0x9fb0ff, 0x2a2150, .95)); const dl = new T.DirectionalLight(0xbcc8ff, .55); dl.position.set(-30, 50, -20); scene.add(dl);
        buildCity(); me = makeAvatar(0); scene.add(me); ok = true; resize();
      } catch (e) { failed = true; canvas.style.display = 'none'; $('#hHint').textContent = 'Grafik 3D tidak tersedia di perangkat ini. Buka daftar Misi untuk tetap bermain.'; }
    })();
  }
  function setMe(info) { meInfo = info; if (ok && me) { const p = me.position.clone(), r = me.rotation.y; scene.remove(me); me = makeAvatar(info.avatar); me.position.copy(p); me.rotation.y = r; scene.add(me); } }
  function setMissions(list) {
    missions = list; Object.values(markers).forEach(e => e.remove()); Object.keys(markers).forEach(k => delete markers[k]); plates.splice(0).forEach(p => scene && scene.remove(p));
    list.forEach(ms => { const el = document.createElement('button'); el.type = 'button'; el.className = 'mk' + (ms.status === 'selesai' ? ' done' : ''); el.innerHTML = '<b>' + (ms.status === 'selesai' ? '✓' : '!') + '</b><span></span>'; el.setAttribute('aria-label', 'Misi ' + ms.judul); el.addEventListener('click', () => { if (onInteract) onInteract(ms); }); $('#wlabels').appendChild(el); el.style.pointerEvents = 'auto'; markers[ms.id] = el;
      if (ok && SLOT[ms.lokasi] && ms.status !== 'selesai') { const p = new T.Mesh(geo(3.6, .06, 3.6), new T.MeshBasicMaterial({ color: 0xffc83d, transparent: true, opacity: .5 })); p.position.set(SLOT[ms.lokasi].x, .22, SLOT[ms.lokasi].z); scene.add(p); plates.push(p); } });
  }
  function setOthers(list) {
    const seen = {}; list.forEach(o => {
      seen[o.id] = 1; let r = remotes.get(o.id);
      if (!r) { if (!ok) return; const g = makeAvatar(o.av); g.position.set(o.x, 0, o.z); scene.add(g); r = { g, av: o.av }; remotes.set(o.id, r); }
      if (r.av !== o.av && ok) { const p = r.g.position.clone(); scene.remove(r.g); r.g = makeAvatar(o.av); r.g.position.copy(p); scene.add(r.g); r.av = o.av; }
      r.tx = o.x; r.tz = o.z; r.text = o.n + ' • Lv ' + o.lv;
    });
    remotes.forEach((r, id) => { if (!seen[id]) { scene.remove(r.g); remotes.delete(id); if (tags[id]) { tags[id].remove(); delete tags[id]; } } });
  }
  function start() { if (running) return; running = true; last = performance.now(); resize(); if (ok && !raf) raf = requestAnimationFrame(frame); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; inp.x = inp.y = 0; inp.keys = {}; }
  function reset() { stop(); remotes.forEach(r => scene && scene.remove(r.g)); remotes.clear(); $('#wlabels').innerHTML = ''; Object.keys(tags).forEach(k => delete tags[k]); Object.keys(markers).forEach(k => delete markers[k]); }
  return {
    init, start, stop, reset, setMe, setMissions, setOthers, get ok() { return ok; }, get failed() { return failed; },
    state: () => ({ x: Math.round(st.x * 10) / 10, z: Math.round(st.z * 10) / 10, r: Math.round(st.r * 100) / 100 }),
    onInteract: f => { onInteract = f; }, nearest: () => near, remotes: () => Array.from(remotes.entries()).map(([id, r]) => ({ id, x: r.tx, z: r.tz, text: r.text })), pos: () => st
  };
})();
