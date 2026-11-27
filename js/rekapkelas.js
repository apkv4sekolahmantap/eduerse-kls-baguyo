/* =====================================================================
   REKAP NILAI PER KELAS — matriks siswa × semua misi & asesmen yang diikuti.
   Tab di halaman Rekap Nilai: "Per Asesmen" (lama) | "Per Kelas • Semua Misi" (baru).
   ===================================================================== */
TS.rkMode = store.get('ev_rkmode', 'as');
T.rekapAs = T.rekap;
T.rekap = function () { if (TS.rkMode === 'kelas') return rekapKelas(); T.rekapAs(); $('#t-rekap').insertAdjacentHTML('afterbegin', rkTabs()); };
const rkTabs = () => '<div class="seg2" style="margin-bottom:14px"><button type="button" class="' + (TS.rkMode !== 'kelas' ? 'on' : '') + '" onclick="TX.rkMode(\'as\')">' + ico('assignment', 16) + ' Per Asesmen</button><button type="button" class="' + (TS.rkMode === 'kelas' ? 'on' : '') + '" onclick="TX.rkMode(\'kelas\')">' + ico('table_chart', 16) + ' Per Kelas • Semua Misi</button></div>';
TX.rkMode = m => { TS.rkMode = m; store.set('ev_rkmode', m); TS.pg.rkk = 1; T.rekap(); };
const JR = { STS: 0, SAS: 1, 'Latihan Harian': 2 };
const rkJenis = (a, misiBy) => a.Jenis === 'Latihan Harian' ? (misiBy[a.ID] ? 'Misi' : 'Latihan') : a.Jenis;

function rkData(all) {
  const fj = all ? '' : (TS.q.rkj || ''), misiBy = {}; TS.b.misi.forEach(m => misiBy[m.IDAsesmen] = m);
  let as = clsAsesmen().filter(a => a.Status !== 'Draft');
  if (fj === 'misi') as = as.filter(a => misiBy[a.ID]); else if (fj) as = as.filter(a => a.Jenis === fj);
  as.sort((a, b) => (JR[a.Jenis] - JR[b.Jenis]) || a.Judul.localeCompare(b.Judul));
  const nm = {}; TS.b.nilai.forEach(n => nm[n.IDSiswa + '|' + n.IDAsesmen] = n);
  const rows = clsStudents().map(s => {
    const cells = as.map(a => nm[s.id + '|' + a.ID] || null), fin = cells.filter(c => c && c.Status !== 'Mengerjakan');
    return { s, cells, fin: fin.length, avg: fin.length ? fin.reduce((x, c) => x + c.NilaiAkhir, 0) / fin.length : null, tuntas: cells.reduce((x, c, i) => x + (c && c.Status !== 'Mengerjakan' && c.NilaiAkhir >= as[i].KKM ? 1 : 0), 0) };
  }).sort((a, b) => (b.avg == null ? -1 : b.avg) - (a.avg == null ? -1 : a.avg) || a.s.nama.localeCompare(b.s.nama));
  rows.forEach((r, i) => r.rank = i + 1);
  const colAvg = as.map((a, i) => { const v = rows.map(r => r.cells[i]).filter(c => c && c.Status !== 'Mengerjakan'); return { n: v.length, avg: v.length ? v.reduce((x, c) => x + c.NilaiAkhir, 0) / v.length : null }; });
  return { as, rows, colAvg, misiBy };
}
function rekapKelas() {
  const { as, rows, colAvg, misiBy } = rkData(), kls = TS.cm[TS.kelas] || {}, q = (TS.q.rkq || '').toLowerCase(), fj = TS.q.rkj || '';
  const vis = rows.filter(r => !q || (r.s.nama + ' ' + (r.s.nisn || '')).toLowerCase().includes(q)), wa = rows.filter(r => r.avg != null), kAvg = wa.length ? wa.reduce((x, r) => x + r.avg, 0) / wa.length : null;
  const totFin = rows.reduce((x, r) => x + r.fin, 0), nCell = rows.length * as.length, totT = rows.reduce((x, r) => x + r.tuntas, 0), nMisi = as.filter(a => misiBy[a.ID]).length;
  const kp = (l, v, n, ic) => '<div class="tcard kpi"><div class="kl"><span>' + l + '</span>' + ico(ic, 20) + '</div><div class="kv">' + v + '</div><div class="kn">' + n + '</div></div>';
  const cell = (c, a, sid) => !c ? '<span style="color:var(--t-mu)">–</span>' : c.Status === 'Mengerjakan' ? chipT('…', 'wa') : '<span class="sc ' + scoreCls(c.NilaiAkhir, a.KKM) + '" title="Lihat lembar jawaban" onclick="TX.sheet(\'' + a.ID + '\',\'' + sid + '\')">' + num(c.NilaiAkhir, 0) + (c.Status === 'Perlu Dinilai' ? '*' : '') + '</span>';
  $('#t-rekap').innerHTML = rkTabs() + '<div class="ph"><div><div class="eb">Evaluasi Pembelajaran Berkelanjutan</div><h1>Rekap Nilai per Kelas</h1><p>Seluruh nilai siswa <b>' + esc(kls.NamaKelas || '-') + '</b> pada semua misi &amp; asesmen yang diikuti. Ganti kelas lewat pilihan di bagian atas.</p></div><div class="row g8 wrap"><button class="tb" onclick="TX.xlsxKelas()">' + ico('table_view', 20) + 'Unduh Excel (.xlsx)</button><button class="tb" onclick="TX.pdfKelas()">' + ico('picture_as_pdf', 20) + 'Cetak PDF</button></div></div>' +
    '<div class="grid g4" style="margin-bottom:16px">' + kp('Siswa', rows.length, 'Terdaftar di kelas ini', 'groups') + kp('Misi & Asesmen', as.length, nMisi + ' misi di peta • ' + (as.length - nMisi) + ' lainnya', 'flag') + kp('Rata-rata Kelas', kAvg == null ? '–' : num(kAvg), 'Rata-rata dari rata-rata tiap siswa', 'show_chart') + kp('Partisipasi', nCell ? Math.round(totFin / nCell * 100) + '%' : '–', totFin + ' dari ' + nCell + ' pengerjaan' + (totFin ? ' • tuntas ' + Math.round(totT / totFin * 100) + '%' : ''), 'donut_large') + '</div>' +
    '<div class="tools"><input class="tin" id="rkq" placeholder="Cari nama atau NISN…" value="' + esc(TS.q.rkq || '') + '">' + sel('rkj', [['', 'Semua misi & asesmen'], ['misi', 'Misi di peta saja'], 'STS', 'SAS', 'Latihan Harian'], fj) + '<span style="margin-left:auto;font-size:12px;color:var(--t-mu)">Klik nilai untuk melihat lembar jawaban • <b>*</b> = menunggu nilai uraian • – = belum dikerjakan</span></div>' +
    (!as.length ? empty('flag', 'Belum ada misi/asesmen aktif pada kelas ini.') : !rows.length ? empty('person_off', 'Belum ada siswa di kelas ini.') : !vis.length ? empty('search_off', 'Tidak ada siswa yang cocok.') :
    '<div class="twrap"><table class="tt mtx"><thead><tr><th>Siswa</th>' + as.map(a => '<th class="num" title="' + esc(a.Judul) + ' • KKM ' + a.KKM + '">' + (misiBy[a.ID] ? ico('flag', 13) + ' ' : '') + esc(rkJenis(a, misiBy)) + '<small>' + esc(a.Judul) + '</small></th>').join('') + '<th class="num">Selesai</th><th class="num">Rata-rata</th><th class="num">Tuntas</th></tr></thead><tbody>' +
    slice('rkk', vis, 10).map(r => '<tr><td style="white-space:nowrap"><span class="chipT" style="width:26px;height:26px;justify-content:center;border-radius:50%;' + (r.rank === 1 && r.avg != null ? 'background:#FFE9A8;color:#7a5200' : 'background:var(--t-soft);color:var(--t-blue)') + '">' + r.rank + '</span> ' + avs(r.s.avatar, 28) + ' <a href="#" onclick="TX.rapor(\'' + r.s.id + '\');return false" style="color:var(--t-tx);font-weight:600;text-decoration:none">' + esc(r.s.nama) + '</a></td>' + r.cells.map((c, i) => '<td class="num">' + cell(c, as[i], r.s.id) + '</td>').join('') +
      '<td class="num">' + r.fin + ' / ' + as.length + '</td><td class="num">' + (r.avg == null ? '–' : '<span class="sc ' + scoreCls(r.avg, TS.b.cfg.kkm || 75) + '">' + num(r.avg) + '</span>') + '</td><td class="num">' + r.tuntas + ' / ' + r.fin + '</td></tr>').join('') +
    '</tbody><tfoot><tr><td>Rata-rata per misi/asesmen</td>' + colAvg.map(c => '<td class="num">' + (c.avg == null ? '–' : num(c.avg) + '<div style="font-weight:500;font-size:10px;color:var(--t-mu)">' + c.n + ' siswa</div>') + '</td>').join('') + '<td class="num">' + totFin + '</td><td class="num">' + (kAvg == null ? '–' : num(kAvg)) + '</td><td class="num">' + totT + '</td></tr></tfoot></table>' + pager('rkk', vis.length, 10) + '</div>');
  $('#rkq').oninput = debounce(() => { TS.q.rkq = val('rkq'); TS.pg.rkk = 1; rekapKelas(); const e = $('#rkq'); e.focus(); e.setSelectionRange(e.value.length, e.value.length); }, 200);
  $('#rkj').onchange = () => { TS.q.rkj = val('rkj'); TS.pg.rkk = 1; rekapKelas(); };
}
/* Rapor satu siswa: seluruh misi & asesmen kelasnya */
TX.rapor = sid => {
  const s = TS.sm[sid]; if (!s) return; const { as, rows, misiBy } = rkData(true), r = rows.find(x => x.s.id === sid); if (!r) return;
  const body = '<div class="row g12" style="margin-bottom:12px">' + avs(s.avatar, 54) + '<div><b style="font-size:17px;font-family:var(--f-h)">' + esc(s.nama) + '</b><div style="color:var(--t-mu);font-size:13px">NISN: ' + esc(s.nisn || '-') + ' • Level ' + s.level + ' • ' + num(s.poin, 0) + ' poin • Peringkat ' + r.rank + ' dari ' + rows.length + '</div></div></div>' +
    '<div class="grid g3" style="margin-bottom:12px"><div class="tcard kpi"><div class="kl">Rata-rata</div><div class="kv">' + (r.avg == null ? '–' : num(r.avg)) + '</div></div><div class="tcard kpi"><div class="kl">Selesai</div><div class="kv">' + r.fin + '<small>/ ' + as.length + '</small></div></div><div class="tcard kpi"><div class="kl">Tuntas</div><div class="kv">' + r.tuntas + '<small>/ ' + r.fin + '</small></div></div></div>' +
    '<div class="twrap"><table class="tt"><thead><tr><th>Misi / Asesmen</th><th>Jenis</th><th class="num">KKM</th><th class="num">Nilai</th><th>Status</th><th>Selesai</th><th class="num">Integritas</th></tr></thead><tbody>' + as.map((a, i) => {
      const c = r.cells[i], m = misiBy[a.ID], st = !c ? chipT('Belum dikerjakan') : c.Status === 'Mengerjakan' ? chipT('Sedang mengerjakan', 'wa') : c.Status === 'Perlu Dinilai' ? chipT('Menunggu nilai uraian', 'wa') : c.NilaiAkhir >= a.KKM ? chipT('Tuntas', 'ok') : chipT('Belum tuntas', 'er');
      return '<tr><td><b>' + esc(a.Judul) + '</b>' + (m ? '<div style="font-size:11px;color:var(--t-mu)">Misi di ' + esc((SLOT[m.Lokasi] || {}).nama || m.Lokasi) + '</div>' : '') + '</td><td>' + jenisChip(rkJenis(a, misiBy) === 'Misi' ? 'Latihan Harian' : a.Jenis) + '</td><td class="num">' + a.KKM + '</td><td class="num">' + (c && c.Status !== 'Mengerjakan' ? '<span class="sc ' + scoreCls(c.NilaiAkhir, a.KKM) + '" onclick="TX.sheet(\'' + a.ID + '\',\'' + sid + '\')" style="cursor:pointer">' + num(c.NilaiAkhir, 0) + '</span>' : '–') + '</td><td>' + st + '</td><td>' + (c && c.WaktuSelesai ? fmtDT(c.WaktuSelesai) : '-') + '</td><td class="num">' + (c && c.Status !== 'Mengerjakan' ? c.Integritas + '%' : '-') + '</td></tr>'; }).join('') + '</tbody></table></div>';
  mOpen('Rapor — ' + esc(s.nama), as.length ? body : empty('flag', 'Belum ada misi/asesmen pada kelas ini.'), '<button class="tb" onclick="mClose()">Tutup</button>', true);
};
TX.xlsxKelas = async () => {
  const { as, rows, misiBy } = rkData(), kls = TS.cm[TS.kelas] || {}; if (!as.length) return toast('Belum ada misi/asesmen', 'wa');
  const head = ['No', 'Nama', 'NISN'].concat(as.map(a => a.Judul + ' (' + rkJenis(a, misiBy) + ')'), ['Selesai', 'Rata-rata', 'Tuntas']), fn = 'Rekap_Kelas_' + String(kls.NamaKelas || 'Kelas').replace(/\W+/g, '_');
  const data = rows.map((r, i) => [i + 1, r.s.nama, r.s.nisn || ''].concat(r.cells.map(c => !c ? '' : c.Status === 'Mengerjakan' ? 'proses' : c.NilaiAkhir), [r.fin + '/' + as.length, r.avg == null ? '' : Math.round(r.avg * 10) / 10, r.tuntas + '/' + r.fin]));
  toast('Menyiapkan file…', 'in', 1500);
  try { await LIB.xlsx(); const ws = XLSX.utils.aoa_to_sheet([head].concat(data)); ws['!cols'] = head.map((h, i) => ({ wch: i === 1 ? 26 : i < 3 ? 12 : 16 })); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Rekap Kelas'); dl(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fn + '.xlsx'); toast('Excel diunduh', 'ok'); }
  catch (e) { const csv = [head].concat(data).map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n'); dl(new Blob(['\ufeff' + csv], { type: 'text/csv' }), fn + '.csv'); toast('Library Excel tidak termuat — diunduh sebagai CSV', 'wa', 4000); }
};
TX.pdfKelas = async () => {
  toast('Membuat PDF…', 'in', 3000);
  try { const r = await apiT('apiExportKelasPdf', TS.kelas), bin = atob(r.b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); const blob = new Blob([u8], { type: 'application/pdf' }), url = URL.createObjectURL(blob);
    mOpen('Pratinjau Rekap Kelas', '<iframe src="' + url + '" style="width:100%;height:60vh;border:1px solid var(--t-bd);border-radius:8px" title="Pratinjau PDF"></iframe>', '<button class="tb" onclick="mClose()">Tutup</button><button class="tb p" id="pdfDl">' + ico('download', 18) + 'Unduh PDF</button>', true); $('#pdfDl').onclick = () => dl(blob, r.name); }
  catch (e) { toast(e.message, 'er', 5000); }
};
