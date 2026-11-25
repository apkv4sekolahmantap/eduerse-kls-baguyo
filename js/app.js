/* =====================================================================
   EduVerse — titik masuk aplikasi (dimuat paling akhir)
   ===================================================================== */
(function main() {
  setTheme(store.get('ev_theme', 'light')); tBind(); Stu.initJoin(); showView('v-landing');
  const hide = () => { const b = $('#boot'); if (b) { b.style.opacity = '0'; setTimeout(() => b.remove(), 260); } };
  // Jika font ikon gagal dimuat (offline), sembunyikan teks ligatur agar layout tidak rusak
  const chkIcons = () => { const t = document.createElement('span'); t.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;font-family:'Material Symbols Outlined';font-size:24px"; t.textContent = 'home'; document.body.appendChild(t); const w = t.offsetWidth; t.remove(); document.body.classList.toggle('noicons', w > 40); };
  setTimeout(chkIcons, 2500); setTimeout(chkIcons, 9000);
  window.addEventListener('unhandledrejection', e => { if (e.reason && !e.reason.net && e.reason.message) console.warn(e.reason.message); });

  // Mode verifikasi sertifikat (dibuka dari QR): index.html?cek=EV/2026/0001
  const cek = new URLSearchParams(location.search).get('cek');
  if (cek) { showView('v-cek'); hide(); verifyCert(cek); return; }

  if (!gasReady()) setTimeout(() => toast('Backend belum terhubung — isi GAS_URL di js/config.js', 'wa', 10000), 600);
  else api('apiPing').catch(() => { }); // pemanasan GAS selagi siswa membaca halaman awal

  const saved = store.get('ev_sess');
  if (saved && saved.token) {
    const cb = store.get('ev_boot_' + saved.role);
    if (cb) {
      App.token = saved.token; App.role = saved.role;
      if (saved.role === 'siswa') { Stu.enter({ token: saved.token, user: cb.user, boot: cb }, true); apiT('apiStudentBoot').then(b => Stu.refresh(b)).catch(() => { }); }
      else { Tch.enter({ token: saved.token, user: cb.user, boot: cb }, true); Tch.reload(false); }
    } else api('apiResume', saved.token).then(d => { saved.role === 'siswa' ? Stu.enter({ token: d.token, user: d.user, boot: d.boot }) : Tch.enter(d); }).catch(() => clearSession());
  }
  hide();
})();

async function verifyCert(nomor) {
  const box = $('#cekBox'); $('#cekHome').onclick = () => { location.href = location.pathname; };
  try {
    const r = await api('apiVerifyCert', nomor);
    box.innerHTML = r.valid ? '<span class="material-symbols-outlined fill ok" style="font-size:56px">verified</span><div class="big ok">Sertifikat Valid</div><div style="font-size:18px;font-weight:700">' + esc(r.nama) + '</div><div class="mut">' + esc(r.penghargaan) + '</div><div class="mut" style="font-size:12px;margin-top:8px">No. ' + esc(r.nomor) + ' • ' + esc(r.sekolah || '') + '</div>'
      : '<span class="material-symbols-outlined fill no" style="font-size:56px">cancel</span><div class="big no">Tidak Ditemukan</div><div class="mut">Nomor ' + esc(nomor) + ' tidak terdaftar.</div>';
  } catch (e) { box.innerHTML = '<span class="material-symbols-outlined no" style="font-size:48px">cloud_off</span><div class="big no">Gagal memeriksa</div><div class="mut">' + esc(e.message) + '</div>'; }
}
