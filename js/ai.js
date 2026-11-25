/* =====================================================================
   GENERATOR SOAL AI (guru) — kunci API milik akun masing-masing.
   Alur: Form -> AI membuat draf -> guru periksa/edit -> simpan ke Bank Soal
         (opsional sekaligus jadi Latihan Harian / Misi di peta game).
   ===================================================================== */
let AIS = null, AID = null;
const AI_HELP = {
  gemini: { url: 'https://aistudio.google.com/app/apikey', txt: 'Buka Google AI Studio → Create API key. Tersedia kuota gratis (syarat dapat berubah).' },
  claude: { url: 'https://console.anthropic.com/settings/keys', txt: 'Buka Anthropic Console → Create Key. Berbayar sesuai pemakaian.' },
  openai: { url: 'https://platform.openai.com/api-keys', txt: 'Untuk OpenAI isi Base URL https://api.openai.com/v1. Untuk OpenRouter/Groq/dll. isi Base URL layanannya dan nama model.' }
};
const aiProv = id => (AIS && AIS.providers.find(p => p.id === id)) || { nama: id, model: '' };
const aiLoad = '<div class="center" style="padding:44px 12px"><span class="spin" style="width:34px;height:34px;color:var(--t-blue)"></span><p id="aiLoadT" style="color:var(--t-mu);margin-top:12px">Memuat…</p></div>';

/* ---------- Form parameter ---------- */
TX.aiOpen = async () => {
  mOpen('✨ Buat Soal dengan AI', aiLoad, '', true);
  try { AIS = await apiT('apiAIGetSettings'); } catch (e) { mClose(); return toast(e.message, 'er'); }
  aiForm();
};
function aiForm(keep) {
  const f = Object.assign({ pg: 5, isian: 2, uraian: 1, opsi: 4, bpg: 10, bisian: 10, buraian: 30, kesulitan: 'Sedang', kelas: TS.kelas, mapel: '', tingkat: '', topik: '', catatan: '' }, store.get('ev_ai_form', {}), keep || {});
  if (!TS.cm[f.kelas]) f.kelas = TS.kelas || (TS.b.classes[0] || {}).ID;
  const c = TS.cm[f.kelas] || {};
  if (!f.mapel) f.mapel = c.Mapel || ''; if (!f.tingkat) f.tingkat = c.NamaKelas ? c.NamaKelas.split(' - ')[0] + (c.Jenjang ? ' (' + c.Jenjang + ')' : '') : '';
  const e = AIS.effective, st = e ? '<div class="ins" style="border-color:var(--t-blue);background:var(--t-soft)">' + ico('verified', 16) + ' Memakai <b>' + esc(aiProv(e.provider).nama) + '</b> • model <code>' + esc(e.model) + '</code> • kunci ' + (e.src === 'sendiri' ? 'milik Anda •••• ' + esc(AIS.last4) : 'cadangan sekolah') + '</div>'
    : '<div class="ins">' + ico('key', 16) + ' <b>Belum ada kunci API AI.</b> Setiap guru memakai akun AI-nya sendiri. <button class="tb sm a" onclick="TX.aiSettings(true)">Atur kunci AI</button></div>';
  const num = (id, v, mx) => '<input class="tin" type="number" id="' + id + '" min="0" max="' + mx + '" value="' + v + '" oninput="TX.aiSum()">';
  $('#mdl header h3').textContent = '✨ Buat Soal dengan AI';
  $('#mdl .bd2').innerHTML = st + '<div style="height:12px"></div><div class="frow">' + fld('Kelas', sel('aiKls', TS.b.classes.map(x => [x.ID, x.NamaKelas]), f.kelas, 'onchange="TX.aiKls()"'), 'aiKls') + fld('Mata pelajaran', inp('aiMapel', f.mapel, 'maxlength="60" list="dlM2"') + '<datalist id="dlM2">' + [...new Set(TS.b.bank.map(x => x.Mapel).concat(TS.b.classes.map(x => x.Mapel)))].filter(Boolean).map(m => '<option value="' + esc(m) + '">').join('') + '</datalist>', 'aiMapel') + fld('Tingkat / kelas', inp('aiTkt', f.tingkat, 'maxlength="50" placeholder="mis. Kelas 5 SD"'), 'aiTkt') + '</div>' +
    fld('Materi / topik soal', '<textarea class="tta" id="aiTopik" maxlength="500" style="min-height:70px" placeholder="Contoh: Pecahan senilai dan operasi penjumlahan pecahan berpenyebut berbeda">' + esc(f.topik) + '</textarea>', 'aiTopik') +
    '<div class="frow">' + fld('Tingkat kesukaran', sel('aiKes', ['Mudah', 'Sedang', 'Sulit', 'Campuran'], f.kesulitan), 'aiKes') + fld('Jumlah opsi pilihan ganda', sel('aiOps', [3, 4, 5], f.opsi), 'aiOps') + '</div>' +
    '<div class="frow">' + fld('Pilihan Ganda', num('aiPg', f.pg, 15), 'aiPg') + fld('Isian Singkat', num('aiIs', f.isian, 15), 'aiIs') + fld('Uraian', num('aiUr', f.uraian, 15), 'aiUr') + '</div>' +
    '<div class="frow">' + fld('Bobot PG', inp('aiBpg', f.bpg, 'type="number" min="1" max="100"'), 'aiBpg') + fld('Bobot Isian', inp('aiBis', f.bisian, 'type="number" min="1" max="100"'), 'aiBis') + fld('Bobot Uraian', inp('aiBur', f.buraian, 'type="number" min="1" max="100"'), 'aiBur') + '</div>' +
    fld('Catatan tambahan (opsional)', inp('aiCat', f.catatan, 'maxlength="300" placeholder="Mis. gunakan konteks kehidupan sehari-hari di Kalimantan; hindari soal cerita yang panjang"'), 'aiCat') +
    '<div id="aiSum" style="font-size:13px;color:var(--t-mu)"></div><p style="font-size:12px;color:var(--t-mu);margin:6px 0 0">Yang dikirim ke penyedia AI hanya mapel, tingkat, topik, dan komposisi soal — tanpa data siswa. Hasil AI perlu Anda periksa sebelum dipakai.</p>';
  $('#mdl').querySelector('footer')?.remove();
  $('#mdl').insertAdjacentHTML('beforeend', '<footer><button class="tb" onclick="mClose()">Batal</button><button class="tb" onclick="TX.aiSettings(true)">' + ico('key', 18) + 'Pengaturan AI</button><button class="tb a" id="aiGen" onclick="TX.aiGo()">' + ico('auto_awesome', 18) + 'Buat Soal</button></footer>'); TX.aiSum();
}
TX.aiSum = () => { const n = (+val('aiPg') || 0) + (+val('aiIs') || 0) + (+val('aiUr') || 0), el = $('#aiSum'); if (el) { el.innerHTML = 'Total <b>' + n + '</b> soal' + (n > 15 ? ' <span style="color:var(--t-er)">— maksimal 15 per permintaan</span>' : n < 1 ? ' <span style="color:var(--t-er)">— isi minimal 1</span>' : ' • perkiraan 10–40 detik'); const b = $('#aiGen'); if (b) b.disabled = n < 1 || n > 15; } };
TX.aiKls = () => { const c = TS.cm[val('aiKls')] || {}; if (c.Mapel) $('#aiMapel').value = c.Mapel; $('#aiTkt').value = c.NamaKelas ? c.NamaKelas.split(' - ')[0] + (c.Jenjang ? ' (' + c.Jenjang + ')' : '') : ''; };
function aiRead() { return { kelas: val('aiKls'), mapel: val('aiMapel').trim(), tingkat: val('aiTkt').trim(), topik: val('aiTopik').trim(), kesulitan: val('aiKes'), opsi: +val('aiOps'), pg: +val('aiPg') || 0, isian: +val('aiIs') || 0, uraian: +val('aiUr') || 0, bpg: +val('aiBpg') || 10, bisian: +val('aiBis') || 10, buraian: +val('aiBur') || 30, catatan: val('aiCat').trim() }; }
TX.aiGo = async () => {
  const p = aiRead(); if (p.mapel.length < 2) return toast('Isi mata pelajaran', 'wa'); if (p.tingkat.length < 2) return toast('Isi tingkat/kelas', 'wa'); if (p.topik.length < 3) return toast('Isi materi/topik soal', 'wa');
  if (!AIS.effective) return TX.aiSettings(true); store.set('ev_ai_form', p);
  const n = p.pg + p.isian + p.uraian; $('#mdl .bd2').innerHTML = aiLoad; $('#mdl footer').innerHTML = '<span style="color:var(--t-mu);font-size:13px;margin-right:auto">Jangan tutup jendela ini</span>';
  const msgs = ['Menyusun ' + n + ' soal…', 'AI sedang menulis soal & kunci jawaban…', 'Memeriksa format dan kunci jawaban…', 'Hampir selesai…']; let mi = 0; const tm = setInterval(() => { const e = $('#aiLoadT'); if (e) e.textContent = msgs[Math.min(++mi, msgs.length - 1)]; }, 7000); $('#aiLoadT').textContent = msgs[0];
  try { const r = await apiTL('apiAIGenerate', p); AID = { p, r }; clearInterval(tm); aiPreview(); }
  catch (e) { clearInterval(tm); toast(e.message, 'er', 6500); if (e.code === 'AIKEY') return TX.aiSettings(true); if (!$('#mov').classList.contains('on')) return; aiForm(p); }
};

/* ---------- Pratinjau & edit draf ---------- */
const kesCls = k => ({ Mudah: 'ok', Sedang: 'wa', Sulit: 'er' }[k] || '');
function aiPreview() {
  const { p, r } = AID, S = r.soal;
  const card = (s, i) => '<div class="tcard" style="padding:12px;margin-bottom:10px"><div class="row between g8 wrap"><label style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" id="aqC' + i + '"' + (s.dup ? '' : ' checked') + ' onchange="TX.aiCnt()"><b>#' + (i + 1) + '</b>' + chipT(s.Jenis, s.Jenis === 'Uraian' ? 'wa' : s.Jenis === 'Isian Singkat' ? 'bl' : '') + chipT(s.Kesulitan, kesCls(s.Kesulitan)) + (s.dup ? chipT('Mirip soal di bank', 'wa') : '') + '</label><span style="font-size:12px;color:var(--t-mu)">Bobot <input class="tin" id="aqB' + i + '" type="number" min="1" max="100" value="' + s.Bobot + '" style="width:70px;min-height:30px;display:inline-block"></span></div>' +
    '<textarea class="tta" id="aqT' + i + '" style="min-height:64px;margin-top:8px">' + esc(s.TeksSoal) + '</textarea>' +
    (s.Jenis === 'Pilihan Ganda' ? '<div style="margin-top:8px">' + s.Opsi.map((o, j) => '<div class="row g8" style="margin-bottom:6px"><input type="radio" name="aqK' + i + '" id="aqR' + i + '_' + j + '" value="' + j + '"' + (o === s.Kunci ? ' checked' : '') + ' aria-label="Kunci ' + String.fromCharCode(65 + j) + '"><b style="width:18px">' + String.fromCharCode(65 + j) + '</b><input class="tin" id="aqO' + i + '_' + j + '" value="' + esc(o) + '"></div>').join('') + '<div style="font-size:11px;color:var(--t-mu)">Bulatan = kunci jawaban</div></div>'
      : '<div class="fld" style="margin-top:8px"><label>' + (s.Jenis === 'Uraian' ? 'Pedoman penskoran' : 'Kunci jawaban (alternatif pisahkan dengan |)') + '</label>' + (s.Jenis === 'Uraian' ? '<textarea class="tta" id="aqK' + i + '" style="min-height:56px">' + esc(s.Kunci) + '</textarea>' : '<input class="tin" id="aqK' + i + '" value="' + esc(s.Kunci) + '">') + '</div>') +
    (s.pembahasan ? '<details style="font-size:12px;color:var(--t-mu)"><summary style="cursor:pointer">Pembahasan AI</summary><div style="padding:6px 0">' + esc(s.pembahasan) + '</div></details>' : '') + '</div>';
  const c = TS.cm[p.kelas] || {}, free = MAP_SLOTS.map(s => { const occ = TS.b.misi.some(m => m.Lokasi === s.id && TS.am[m.IDAsesmen] && TS.am[m.IDAsesmen].IDKelas === p.kelas); return [s.id, s.nama + (occ ? ' (sudah ada misi)' : ''), occ]; });
  const firstFree = (free.find(x => !x[2]) || free[0])[0], dur = Math.max(5, Math.ceil(S.length * 1.5));
  $('#mdl header h3').textContent = '✨ Hasil AI — periksa sebelum disimpan';
  $('#mdl .bd2').innerHTML = (r.peringatan.length ? '<div class="ins" style="margin-bottom:10px">' + ico('info', 16) + ' ' + esc(r.peringatan.join('; ')) + '. Anda bisa menekan <b>Buat ulang</b> untuk melengkapi.</div>' : '') +
    '<div style="font-size:13px;color:var(--t-mu);margin-bottom:10px">' + S.length + ' soal dibuat oleh <b>' + esc(aiProv(r.provider).nama) + '</b> (' + esc(r.model) + ') untuk <b>' + esc(p.mapel) + '</b> • ' + esc(p.tingkat) + ' • sisa jatah jam ini: ' + r.sisa + '</div>' + S.map(card).join('') +
    '<div class="tcard" style="border-color:var(--t-blue)"><h3>' + ico('sports_esports', 20) + ' Gunakan di game</h3><p class="sub">Pilih cara soal-soal ini dipakai siswa</p>' +
    '<label style="display:flex;gap:8px;margin-bottom:6px"><input type="radio" name="aiMode" value="bank" checked onchange="TX.aiMode()"> Simpan ke Bank Soal saja</label><label style="display:flex;gap:8px;margin-bottom:6px"><input type="radio" name="aiMode" value="asesmen" onchange="TX.aiMode()"> Simpan + buat Latihan Harian</label><label style="display:flex;gap:8px;margin-bottom:10px"><input type="radio" name="aiMode" value="misi" onchange="TX.aiMode()"> Simpan + jadikan <b>Misi di peta kota</b> (tanda “!” muncul di game)</label>' +
    '<div id="aiMis" class="hide"><div class="frow">' + fld('Judul', inp('aiJud', 'Misi ' + p.mapel + ': ' + p.topik.slice(0, 40), 'maxlength="80"'), 'aiJud') + fld('Durasi (menit)', inp('aiDur', dur, 'type="number" min="1" max="300"'), 'aiDur') + '</div><div class="frow" id="aiLokW">' + fld('Lokasi di peta', sel('aiLok', free.map(x => [x[0], x[1]]), firstFree), 'aiLok') + fld('Hadiah XP', inp('aiHad', 20, 'type="number" min="0" max="500"'), 'aiHad') + '</div><label style="display:flex;gap:8px;font-size:13px"><input type="checkbox" id="aiAkt" checked> Aktifkan sekarang (siswa langsung bisa mengerjakan)</label></div></div>';
  $('#mdl footer')?.remove(); $('#mdl').insertAdjacentHTML('beforeend', '<footer><button class="tb" onclick="TX.aiBack()">‹ Ubah parameter</button><button class="tb" onclick="TX.aiGo2()">' + ico('refresh', 18) + 'Buat ulang</button><button class="tb p" id="aiSave" onclick="TX.aiSave()"></button></footer>'); TX.aiCnt(); TX.aiMode();
}
TX.aiCnt = () => { const b = $('#aiSave'); if (!b) return; const n = AID.r.soal.filter((s, i) => $('#aqC' + i) && $('#aqC' + i).checked).length; b.disabled = !n; b.innerHTML = ico('save', 18) + 'Simpan ' + n + ' soal'; };
TX.aiMode = () => { const m = ($('input[name=aiMode]:checked') || {}).value, el = $('#aiMis'); if (!el) return; el.classList.toggle('hide', m === 'bank'); $('#aiLokW').classList.toggle('hide', m !== 'misi'); };
TX.aiBack = () => aiForm(AID.p); TX.aiGo2 = () => { aiForm(AID.p); TX.aiGo(); };
TX.aiSave = async () => {
  const { p, r } = AID, recs = [];
  for (let i = 0; i < r.soal.length; i++) {
    if (!$('#aqC' + i).checked) continue; const s = r.soal[i], rec = { Jenis: s.Jenis, Mapel: p.mapel, Topik: s.Topik, Kesulitan: s.Kesulitan, Bobot: Number(val('aqB' + i)), TeksSoal: val('aqT' + i).trim() };
    if (!(rec.Bobot > 0)) return toast('Soal #' + (i + 1) + ': bobot tidak valid', 'er'); if (rec.TeksSoal.length < 5) return toast('Soal #' + (i + 1) + ': teks terlalu pendek', 'er');
    if (s.Jenis === 'Pilihan Ganda') { const ops = s.Opsi.map((_, j) => val('aqO' + i + '_' + j).trim()), k = $('input[name=aqK' + i + ']:checked'); if (ops.some(o => !o)) return toast('Soal #' + (i + 1) + ': ada opsi kosong', 'er'); if (new Set(ops.map(o => o.toLowerCase())).size !== ops.length) return toast('Soal #' + (i + 1) + ': opsi ada yang kembar', 'er'); if (!k) return toast('Soal #' + (i + 1) + ': pilih kunci jawaban', 'er'); rec.Opsi = ops; rec.Kunci = ops[+k.value]; }
    else { rec.Kunci = val('aqK' + i).trim(); if (!rec.Kunci) return toast('Soal #' + (i + 1) + ': kunci kosong', 'er'); }
    recs.push(rec);
  }
  if (!recs.length) return toast('Pilih minimal 1 soal', 'wa');
  const mode = $('input[name=aiMode]:checked').value; let jud, dur, lok, had, akt;
  if (mode !== 'bank') { jud = val('aiJud').trim(); dur = +val('aiDur'); lok = mode === 'misi' ? val('aiLok') : ''; had = +val('aiHad') || 0; akt = $('#aiAkt').checked; if (jud.length < 3) return toast('Judul minimal 3 karakter', 'er'); if (!(dur >= 1)) return toast('Durasi tidak valid', 'er');
    if (mode === 'misi' && TS.b.misi.some(m => m.Lokasi === lok && TS.am[m.IDAsesmen] && TS.am[m.IDAsesmen].IDKelas === p.kelas)) return toast('Lokasi itu sudah punya misi. Pilih lokasi lain.', 'er'); }
  const b = $('#aiSave'); b.disabled = true; b.innerHTML = '<span class="spin"></span> Menyimpan…'; let saved = [], step = 'soal';
  try {
    const sv = await apiT('apiSaveBatch', 'BankSoal', recs); saved = sv.saved; if (!saved.length) throw new Error(sv.errors[0] || 'Soal tidak valid.');
    TS.b.bank.unshift(...saved); idx(); let msg = saved.length + ' soal masuk Bank Soal';
    if (mode !== 'bank') {
      step = 'asesmen'; const as = await apiT('apiSave', 'Asesmen', { ID: genId('AS'), IDKelas: p.kelas, Jenis: 'Latihan Harian', Judul: jud, DaftarSoal: saved.map(x => x.ID), Durasi: dur, JadwalMulai: 0, JadwalSelesai: 0, AcakSoal: 'Ya', Status: akt ? 'Aktif' : 'Draft', KKM: TS.b.cfg.kkm || 75 });
      TS.b.asesmen.unshift(as); idx(); msg += ' • Latihan Harian “' + as.Judul + '” ' + (akt ? 'aktif' : '(draft)');
      if (mode === 'misi') { step = 'misi'; const ms = await apiT('apiSave', 'Misi', { ID: genId('MS'), IDAsesmen: as.ID, Lokasi: lok, Hadiah: had, Judul: jud, Jenis: 'Kuis Pilihan', Status: 'Aktif' }); TS.b.misi.unshift(ms); msg += ' • Misi di ' + SLOT[lok].nama; }
    }
    persistBoot(); render(); AID = null;
    $('#mdl header h3').textContent = '✅ Tersimpan'; $('#mdl .bd2').innerHTML = '<div class="center" style="padding:24px 8px"><span class="material-symbols-outlined" style="font-size:54px;color:var(--t-ok)">task_alt</span><p style="font-size:15px">' + esc(msg) + '.</p>' + (mode === 'misi' && akt ? '<p style="color:var(--t-mu);font-size:13px">Siswa kelas ini akan melihat tanda “!” di ' + esc(SLOT[lok].nama) + ' pada sinkronisasi berikutnya (±' + (TS.b.cfg.syncSeconds || 4) + ' detik).</p>' : '') + '</div>'; $('#mdl footer').innerHTML = '<button class="tb" onclick="mClose()">Selesai</button>' + (mode === 'misi' ? '<button class="tb p" onclick="mClose();tGo(\'misi\')">Lihat di Editor Misi</button>' : '<button class="tb p" onclick="mClose();tGo(\'' + (mode === 'asesmen' ? 'asesmen' : 'bank') + '\')">Lihat hasilnya</button>');
  } catch (e) {
    b.disabled = false; TX.aiCnt(); if (saved.length) { render(); persistBoot(); toast('Soal sudah masuk Bank, tetapi langkah “' + step + '” gagal: ' + e.message + ' — selesaikan manual di Desain Asesmen.', 'wa', 9000); mClose(); } else toast(e.message, 'er', 5000);
  }
};

/* ---------- Pengaturan kunci AI ---------- */
TX.aiSettings = async back => {
  mOpen('Pengaturan AI', aiLoad, '', false);
  try { AIS = await apiT('apiAIGetSettings'); } catch (e) { mClose(); return toast(e.message, 'er'); }
  const s = AIS, h = AI_HELP[s.provider] || AI_HELP.gemini;
  $('#mdl .bd2').innerHTML = '<p style="margin:0 0 12px;color:var(--t-mu);font-size:13px">Setiap guru memakai <b>akun AI miliknya sendiri</b>. Kunci disimpan aman di server dan <b>tidak pernah ditampilkan lagi</b>; biaya/kuota mengikuti akun Anda.</p>' +
    fld('Penyedia AI', sel('asP', s.providers.map(p => [p.id, p.nama]), s.provider, 'onchange="TX.aiProv()"'), 'asP') + fld('Nama model <span style="font-weight:400">(kosongkan = bawaan)</span>', inp('asM', s.model, 'maxlength="80" autocapitalize="none"'), 'asM') +
    '<div id="asBW">' + fld('Base URL (OpenAI-compatible)', inp('asB', s.baseUrl || 'https://api.openai.com/v1', 'maxlength="200" autocapitalize="none"'), 'asB') + '</div>' +
    fld('Kunci API' + (s.hasKey ? ' <span style="font-weight:400">— tersimpan •••• ' + esc(s.last4) + ' (kosongkan = tetap)</span>' : ''), inp('asK', '', 'type="password" autocomplete="off" autocapitalize="none" placeholder="' + (s.hasKey ? '••••••••' : 'Tempel kunci API di sini') + '"'), 'asK') +
    '<div id="asH" style="font-size:12px;color:var(--t-mu);margin-bottom:10px"></div>' + (s.isAdmin ? '<label style="display:flex;gap:8px;font-size:13px;margin-bottom:6px"><input type="checkbox" id="asG"> Simpan sebagai <b>kunci cadangan sekolah</b> (dipakai guru yang belum punya kunci)' + (s.hasGlobal ? ' — saat ini ada •••• ' + esc(s.globalLast4) : '') + '</label>' : '') + '<div id="asRes" style="font-size:13px;margin-top:8px"></div>';
  $('#mdl').insertAdjacentHTML('beforeend', '<footer>' + (s.hasKey ? '<button class="tb d" onclick="TX.aiDel()" style="margin-right:auto">Hapus kunci saya</button>' : '') + '<button class="tb" onclick="TX.aiSetBack(' + (back ? 'true' : 'false') + ')">' + (back ? 'Kembali' : 'Tutup') + '</button><button class="tb" id="asT" onclick="TX.aiTest()">Tes Koneksi</button><button class="tb p" id="asS" onclick="TX.aiSetSave(' + (back ? 'true' : 'false') + ')">Simpan</button></footer>'); TX.aiProv();
};
TX.aiProv = () => { const id = val('asP'), p = aiProv(id), h = AI_HELP[id]; $('#asM').placeholder = p.model || 'wajib diisi (mis. nama model dari penyedia)'; $('#asBW').classList.toggle('hide', id !== 'openai'); $('#asH').innerHTML = esc(h.txt) + ' <a href="' + h.url + '" target="_blank" rel="noopener" style="color:var(--t-blue)">Buka halaman kunci API ↗</a>'; };
TX.aiSetBack = back => { if (back && AIS) { mOpen('✨ Buat Soal dengan AI', aiLoad, '', true); aiForm(); } else mClose(); };
TX.aiSetSave = async back => {
  const b = $('#asS'); b.disabled = true; b.innerHTML = '<span class="spin"></span>';
  try { await apiT('apiAISaveSettings', { provider: val('asP'), model: val('asM').trim(), baseUrl: val('asB').trim(), key: val('asK').trim(), scope: $('#asG') && $('#asG').checked ? 'global' : 'own' }); toast('Pengaturan AI tersimpan', 'ok'); AIS = await apiT('apiAIGetSettings'); if (back) TX.aiSetBack(true); else TX.aiSettings(false); }
  catch (e) { toast(e.message, 'er', 5000); b.disabled = false; b.textContent = 'Simpan'; }
};
TX.aiTest = async () => {
  const b = $('#asT'), r = $('#asRes'); b.disabled = true; r.innerHTML = '<span class="spin"></span> Menguji koneksi…';
  try { const x = await apiTL('apiAITest'); r.innerHTML = '<span style="color:var(--t-ok)">✔ Terhubung ke ' + esc(aiProv(x.provider).nama) + ' • model ' + esc(x.model) + ' • ' + x.ms + ' ms</span>'; }
  catch (e) { r.innerHTML = '<span style="color:var(--t-er)">✖ ' + esc(e.message) + '</span>'; } finally { b.disabled = false; }
};
TX.aiDel = () => confirmDel('Hapus kunci API pribadi Anda dari server?', async () => { try { await apiT('apiAIClear', 'own'); toast('Kunci dihapus', 'ok'); TX.aiSettings(false); } catch (e) { toast(e.message, 'er'); } });
