# Panduan Instalasi — EduVerse Kelas Baguyo (Backend GAS + Frontend GitHub Pages)

Urutan wajib: **A. Backend → B. Isi config.js → C. Push ke GitHub → D. Aktifkan Pages → E. Uji.**
Alasannya: frontend butuh URL backend (`GAS_URL`) *sebelum* di-push.

---
## A. Backend (Google Apps Script)

**Berkas yang dipakai:** `Kode.gs` dan `appsscript.json` (diberikan terpisah, bukan di dalam ZIP).

### A1. Proyek baru (belum pernah pasang versi sebelumnya)
1. Buka https://script.google.com → **Proyek baru** → namai *EduVerse API*.
2. **Project Settings** → centang **Show "appsscript.json" manifest file in editor**. Ganti isi `appsscript.json` dengan berkas yang diberikan.
3. Ganti isi `Code.gs` dengan isi `Kode.gs` (rename file menjadi `Kode`).
4. Pilih fungsi **`setupAppEnvironment`** → ▶ **Run** → izinkan akses (Drive, Sheets, Docs, Gmail). Cek *Execution log* — harus ada ✅ dan tautan Spreadsheet/Folder. Fungsi ini aman bila terpanggil dua kali (tidak membuat duplikat).
5. Jalankan **`installTriggers`** sekali (menjaga server tetap hangat tiap 5 menit).

### A2. Sudah pernah pasang versi iFrame sebelumnya (data tetap aman)
1. Ganti isi `Kode.gs` dan `appsscript.json` dengan versi baru.
2. **Hapus** file `Index`, `Stylesheet`, `JavaScript` (tidak dipakai lagi).
3. Tidak perlu menjalankan setup lagi — Spreadsheet & Drive yang lama tetap dipakai.

### A3. Deploy sebagai Web App
1. **Deploy → New deployment → ⚙ Web app**
2. **Execute as: Me** · **Who has access: Anyone** → **Deploy**
3. **Salin URL yang berakhiran `/exec`.**
   (A2: gunakan **Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy** agar URL lama tetap sama.)
4. **Tes:** tempel `URL_ANDA/exec?action=ping` di browser. Harus muncul JSON `{"success":true,...,"message":"pong"}`.
   Jika yang muncul halaman login Google → akses belum **Anyone**.

> Setiap kali `Kode.gs` diubah, deploy ulang dengan **New version**.

---
## B. Isi `js/config.js`
Buka `js/config.js` dengan Notepad, ganti teks `ISI_URL_DEPLOYMENT_DI_SINI/exec` dengan URL `/exec` dari langkah A3:
```js
GAS_URL: 'https://script.google.com/macros/s/AKfycb.../exec',
```
Simpan.

---
## C. Push ke GitHub
**Folder kerja Anda = folder hasil ekstraksi ZIP, yaitu `eduverse-kelas-baguyo`** — yang langsung berisi `index.html`, `css`, `js`. Di folder inilah `git init` dijalankan (bukan folder induknya, bukan masuk lebih dalam).

> Ekstrak ZIP dengan **Extract All / Ekstrak Semua** (klik kanan), bukan "Extract here" ke folder Downloads.

1. **Pasang Git:** Windows → https://git-scm.com/download/win (pengaturan default). Mac → ketik `git --version` di Terminal.
2. **Akun GitHub:** https://github.com (username Anda jadi bagian alamat situs: `username.github.io`).
3. **Identitas Git (sekali saja):**
   ```bash
   git config --global user.name "Nama Anda"
   git config --global user.email "email@akun-github-anda.com"
   ```
4. **Buat repository:** github.com → **+** → **New repository** → nama `eduverse-kelas-baguyo` → **Public** → **JANGAN** centang README/.gitignore/license → Create.
5. **Buka terminal di folder kerja:** File Explorer → buka folder `eduverse-kelas-baguyo` → klik address bar → ketik `powershell` → Enter.
6. **Verifikasi (gerbang terpenting):**
   ```powershell
   dir
   ```
   Harus terlihat **`index.html`**, folder **`css`**, **`js`**. Jika yang terlihat `backend` / `frontend` / folder lain, Anda salah folder — jangan lanjut.
7. **Push pertama** (satu per satu):
   ```bash
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/USERNAME/eduverse-kelas-baguyo.git
   git push -u origin main
   ```
   Saat diminta *Password*, tempel **Personal Access Token** (layar tampak kosong saat paste — itu normal). Buat token di https://github.com/settings/tokens → *Generate new token (classic)* → centang **repo**.

---
## D. Aktifkan GitHub Pages
Repo → **Settings → Pages** → Source **Deploy from a branch** → Branch **main** · **/ (root)** → **Save** → centang **Enforce HTTPS**.
Tunggu 1–2 menit; muncul *"Your site is live at https://USERNAME.github.io/eduverse-kelas-baguyo/"*.

## E. Uji
- Buka situsnya → **Masuk dengan Kode Kelas** → `BGY204`. (Pertama kali bisa 2–4 detik karena server GAS "bangun".)
- **Masuk Guru** → `guru` / `guru123` (ganti di Admin Panel!).
- Tekan **Ctrl+Shift+R** bila tampilan lama masih muncul.

## Update di kemudian hari
Edit file → di folder kerja jalankan: `git add .` → `git commit -m "catatan"` → `git push`.


---
## F. Fitur Buat Soal dengan AI (guru)

**Di mana:** menu **Bank Soal → ✨ Buat Soal dengan AI** (ikon 🔑 di sebelahnya = Pengaturan AI).

**Setiap guru memakai akun AI-nya sendiri.**
1. Dapatkan kunci API (gratis/berbayar sesuai penyedia):
   - **Google Gemini** (disarankan untuk mulai): https://aistudio.google.com/app/apikey → *Create API key*. Ada kuota gratis (syaratnya dapat berubah).
   - **Anthropic Claude**: https://console.anthropic.com/settings/keys
   - **OpenAI / OpenRouter / Groq dll.** (pilih *OpenAI-compatible*): isi Base URL dan nama model dari layanannya.
2. Buka **Pengaturan AI** → pilih penyedia → tempel kunci → **Simpan** → **Tes Koneksi**.
   Kunci disimpan di server (Script Properties) dan **tidak pernah ditampilkan lagi** ke browser — hanya 4 karakter terakhir.
3. **Buat Soal:** pilih kelas (mapel & tingkat terisi otomatis), tulis materi/topik, pilih tingkat kesukaran (Mudah/Sedang/Sulit/Campuran), isi jumlah Pilihan Ganda / Isian Singkat / Uraian (maks. 15 soal per permintaan) → **Buat Soal**.
4. **Periksa & edit** hasilnya (teks, opsi, kunci, bobot), centang yang dipakai. Soal yang mirip bank soal Anda diberi tanda dan tidak tercentang otomatis.
5. Pilih **Gunakan di game**: simpan ke Bank saja, jadikan **Latihan Harian**, atau **Misi di peta kota** (pilih lokasi + hadiah XP) — siswa yang sedang bermain melihat tanda "!" baru dalam beberapa detik.

**Admin** dapat menyimpan satu *kunci cadangan sekolah* (centang di Pengaturan AI) untuk guru yang belum punya kunci.

**Batasan:** maks. 25 permintaan AI per guru per jam; Apps Script membatasi waktu panggilan ±60 detik, jadi bila muncul "waktu habis" kurangi jumlah soal. **Selalu periksa soal AI sebelum dipakai ujian** (akurasi isi dan kunci jawaban tanggung jawab guru).

### Update dari versi sebelumnya
1. Apps Script: ganti isi `Kode.gs` → **Deploy → Manage deployments → ✏ → Version: New version → Deploy** (URL tetap sama).
2. Frontend: timpa berkas lama dengan isi ZIP baru (tambah `js/ai.js`; `js/config.js` Anda **jangan ditimpa** — atau isi ulang `GAS_URL`).
3. Di folder kerja: `git add .` → `git commit -m "Tambah fitur soal AI"` → `git push`, lalu **Ctrl+Shift+R** di situs.


---
## G. Mengelola daftar siswa kelas (hapus siswa)
**Manajemen Kelas → tombol Siswa** pada kartu kelas: cari nama/NISN, centang beberapa siswa (atau **Pilih semua yang tampak**), lalu **Hapus terpilih**; atau klik ikon tong sampah pada satu baris.
- Yang ikut terhapus: akun, nilai, jawaban, poin, dan catatan integritas siswa. **Tidak bisa dibatalkan.**
- Siswa yang sedang online langsung dikeluarkan ke halaman awal dengan pesan "Akunmu telah dihapus oleh guru."
- Sertifikat yang sudah terbit tetap tersimpan sebagai arsip; QR-nya menampilkan "(siswa telah dihapus dari kelas)".
- Guru hanya dapat menghapus siswa di kelas miliknya; admin dapat semua kelas. Siswa bisa bergabung lagi dengan kode kelas sebagai akun baru.


---
## H. Daftar akun guru & admin
Di halaman **Masuk Guru** ada tab **Daftar Akun**. Admin mengatur aturannya di **Admin Panel → Pendaftaran akun guru & admin**:

| Pengaturan | Arti |
|---|---|
| Mode **Perlu persetujuan** (bawaan) | Guru yang mendaftar berstatus *Menunggu*; admin menekan **Setujui/Tolak** di Admin Panel. |
| Mode **Terbuka** | Guru langsung aktif dan masuk setelah mendaftar. |
| Mode **Ditutup** | Pendaftaran guru tidak bisa dilakukan. |
| **Kode pendaftaran guru** (opsional) | Jika diisi, calon guru wajib memasukkannya (bagikan lewat grup guru). |
| **Kode admin** | Wajib diisi agar *admin baru* bisa mendaftar. Tanpa kode ini, pilihan admin tidak aktif. |

Kode disimpan di server dan tidak ditampilkan lagi setelah disimpan — salin dulu (tombol **Acak** membuat kode kuat) sebelum menekan **Simpan**.
Password minimal 8 karakter dan harus berisi huruf + angka. Pendaftaran dibatasi 20 per jam. **Email tidak diverifikasi**, jadi untuk sekolah gunakan mode persetujuan atau kode pendaftaran.

> ⚠️ **Segera ganti** akun bawaan `admin / admin123` dan `guru / guru123` (Admin Panel → ✏), atau nonaktifkan setelah Anda punya akun sendiri.

## I. Hapus kelas (beserta isinya)
**Manajemen Kelas → ikon tong sampah.** Jika kelas masih berisi siswa/asesmen, dialog menampilkan jumlahnya dan Anda harus mencentang persetujuan. Yang ikut terhapus permanen: siswa, asesmen, misi di peta, hasil ujian, jawaban, dan log integritas. **Bank soal dan sertifikat tidak terhapus.** Siswa yang sedang online langsung dikeluarkan.
Kelas **MANDIRI** (untuk tombol *Belajar Mandiri*) boleh dihapus, tetapi tombol itu tidak berfungsi sampai Anda membuat kelas baru berkode `MANDIRI`.

## Troubleshooting cepat
| Gejala | Penyebab | Solusi |
|---|---|---|
| Situs 404 | `index.html` tidak di root repo | Push ulang dari folder yang benar (lihat C5–C6) |
| Tampil tanpa warna / 404 css | File rata di root | Pastikan folder `css/` & `js/` ada di repo |
| "Backend belum terhubung" | `GAS_URL` belum diisi | Edit `js/config.js`, push ulang |
| "Respons server tidak valid" | Web App bukan *Anyone* / URL salah / belum deploy ulang | Ulangi A3, tes `?action=ping` |
| Login/gabung lambat pertama kali | Cold start GAS | Normal; trigger `installTriggers` mengurangi |
| "Kunci API ditolak" saat buat soal AI | Kunci salah/kedaluwarsa/belum aktif | Buat kunci baru, simpan di Pengaturan AI, Tes Koneksi |
| "Batas pemakaian/kuota AI" | Kuota akun AI habis | Tunggu, atau pakai kunci/penyedia lain |
| "Akun Anda masih menunggu persetujuan admin" | Mode pendaftaran = persetujuan | Admin menyetujui di Admin Panel |
| Kelas tidak bisa dihapus | Memakai versi lama | Update `Kode.gs` (New version) dan frontend, lalu Ctrl+Shift+R |
| QR sertifikat tidak terbuka | Sertifikat dibuat saat memakai file lokal | Buat dari situs `https://...github.io/...` |
