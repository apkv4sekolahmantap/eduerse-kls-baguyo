/* =====================================================================
   MASUK & DAFTAR AKUN GURU/ADMIN
   Mode pendaftaran diatur admin: terbuka · persetujuan · tutup (+ kode pendaftaran / kode admin).
   ===================================================================== */
let REG = null;
function authTab(t) {
  $$('#tTabs button').forEach(b => { const on = b.dataset.t === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  $('#tLoginForm').classList.toggle('hide', t !== 'in'); $('#tRegForm').classList.toggle('hide', t !== 'up');
  if (t === 'up') regLoad(); else setTimeout(() => $('#tUser').focus(), 30);
}
async function regLoad() {
  const info = $('#rInfo'); info.textContent = 'Memuat pengaturan pendaftaran…';
  try { REG = await api('apiRegInfo'); } catch (e) { info.textContent = e.message; return; }
  const m = REG.mode; $('#rGo').disabled = false;
  info.innerHTML = m === 'tutup' ? '<b style="color:var(--t-er)">Pendaftaran guru sedang ditutup.</b> Pendaftaran admin tetap bisa memakai Kode Admin.' : m === 'persetujuan' ? 'Akun guru baru perlu <b>disetujui admin</b> sebelum bisa masuk.' : 'Akun guru langsung aktif setelah mendaftar.';
  regPeran();
}
function regPeran() {
  if (!REG) return; const admin = $('#rPeran').value === 'admin', needKode = admin || REG.needCode;
  $('#rKodeW').classList.toggle('hide', !needKode); $('#rKodeL').textContent = admin ? 'Kode admin (dari admin sekolah yang ada)' : 'Kode pendaftaran guru (dari admin sekolah)';
  $('#rPeran').querySelector('option[value=admin]').disabled = !REG.adminOpen; if (admin && !REG.adminOpen) { $('#rErr').textContent = 'Pendaftaran admin belum dibuka. Minta admin yang ada menetapkan Kode Admin.'; } else $('#rErr').textContent = '';
  $('#rGo').disabled = !admin && REG.mode === 'tutup';
}
function authBind() {
  $('#tTabs').addEventListener('click', e => { const b = e.target.closest('button[data-t]'); if (b) authTab(b.dataset.t); });
  $('#tBack2').addEventListener('click', () => { $('#tlogin').classList.remove('on'); authTab('in'); });
  $('#rPeran').addEventListener('change', regPeran);
  $('#tRegForm').addEventListener('submit', async e => {
    e.preventDefault(); const er = $('#rErr'), b = $('#rGo'); er.textContent = '';
    const q = { peran: val('rPeran'), nama: val('rNama').trim(), email: val('rEmail').trim(), username: val('rUser').trim().toLowerCase(), password: val('rPass'), kode: val('rKode').trim() };
    if (q.nama.length < 3) return er.textContent = 'Isi nama lengkap (min. 3 huruf).'; if (!/^[a-z0-9._-]{3,30}$/.test(q.username)) return er.textContent = 'Username 3–30 karakter: huruf kecil, angka, titik, strip, garis bawah.';
    if (q.password.length < 8 || !/[A-Za-z]/.test(q.password) || !/\d/.test(q.password)) return er.textContent = 'Password minimal 8 karakter, harus ada huruf dan angka.'; if (q.password !== val('rPass2')) return er.textContent = 'Konfirmasi password tidak sama.';
    b.disabled = true; b.innerHTML = '<span class="spin"></span>';
    try {
      const d = await api('apiRegister', q); $('#rPass').value = $('#rPass2').value = '';
      if (d.aktif) { $('#tlogin').classList.remove('on'); authTab('in'); Tch.enter(d); }
      else { authTab('in'); $('#tUser').value = q.username; $('#tErr').style.color = 'var(--t-ok)'; $('#tErr').textContent = d.pesan; }
    } catch (x) { er.textContent = x.message; } finally { b.disabled = false; b.textContent = 'Daftar'; }
  });
  // pesan error login biasa berwarna merah lagi saat mengetik
  $('#tUser').addEventListener('input', () => { $('#tErr').style.color = 'var(--t-er)'; });
}
