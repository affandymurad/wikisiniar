# Wikisiniar

Aplikasi React untuk **mendengarkan artikel Wikipedia**. Tempel tautan artikel,
pilih suara, lalu aplikasi membacakan judul, subjudul, dan isinya memakai mesin
suara bawaan browser (Web Speech API). Tidak ada server sendiri, Python, atau
model eksternal; artikel diambil langsung dari API Wikipedia. Di Chrome dan Edge,
hasil bacaan juga bisa **disimpan sebagai file MP3** lewat perekaman *system
audio* (`getDisplayMedia` + `MediaRecorder`).

> ## Browser yang didukung
>
> Semua browser, desktop maupun mobile, selama mendukung Web Speech API
> (`speechSynthesis`). Mendengarkan (**Bacakan**) bisa di mana saja; **merekam &
> menyimpan** suara hanya bisa di **Google Chrome atau Microsoft Edge versi
> desktop**.
>
> | Browser | Suara yang ditampilkan | Simpan ke MP3 |
> | --- | --- | --- |
> | **Edge** | Suara neural `Microsoft … Online (Natural)` (bawaan, butuh internet) | Ya |
> | **Chrome** | Suara jaringan `Google …` (butuh internet) | Ya |
> | **Safari** | Suara standar Apple (**compact**). Safari tidak menampilkan suara Enhanced/Premium/Siri ke halaman web, jadi kualitasnya lebih "mesin" dibanding Chrome/Edge | Tidak |
> | **Firefox, mobile, dan browser lain** | Semua suara bawaan sistem operasi (kualitas bergantung pada OS) | Tidak |
>
> Di Chrome dan Edge, suara lokal OS yang terdengar robotik
> disembunyikan. Jika browser tidak menyediakan suara yang bisa dipakai (setelah
> menunggu ±4 detik), aplikasi menampilkan panduan.
>
> **Hanya Chrome/Edge desktop yang bisa menyimpan.** Menyimpan ke MP3 butuh
> perekaman system audio yang hanya tersedia di sana, jadi tombol **Bacakan &
> Simpan** dinonaktifkan di Safari, Firefox, dan semua perangkat mobile; tombol
> **Bacakan** tetap berfungsi.

## Fitur

- **Dua bahasa antarmuka** (Indonesia / Inggris) lewat toggle geser di header.
  Default mengikuti bahasa browser; pilihan disimpan.
- **Tema** lewat dropdown: *Ikuti sistem*, *Terang*, *Gelap*. Pilihan disimpan
  dan diterapkan sebelum halaman digambar (tanpa berkedip).
- **Input tautan Wikipedia** (`*.wikipedia.org`, semua bahasa, termasuk
  parameter `oldid`/`curid`) dengan validasi. Halaman utama, halaman khusus,
  namespace non-artikel, dan halaman disambiguasi ditolak dengan pesan yang jelas.
- **Hanya konten bacaan.** Artikel diambil lewat API, diubah dari HTML ke
  Markdown, lalu dibersihkan. Yang dibacakan hanya judul, subjudul, dan isi;
  tabel, infobox, gambar, catatan kaki, daftar isi, serta bagian Referensi dan
  Pranala luar dibuang.
- **Pembacaan yang lebih natural.** Teks dipecah per kalimat tanpa memotong
  angka atau singkatan, kalimat pendek digabung, dan keterangan dalam kurung
  dilewati.
- **Filter bahasa suara** dan **tombol play** di sebelah dropdown suara untuk
  mencoba sample suara sebelum dipakai. Bahasa suara otomatis mengikuti bahasa
  artikel bila tersedia.
- Pengaturan **kecepatan** baca (0,5×–2×), serta tombol **Jeda/Lanjutkan** dan
  **Berhenti**.
- **Bacakan & Simpan** (Chrome/Edge) menghasilkan file **MP3** (128 kbps) dengan
  nama `Wikisiniar-Wikipedia-<bahasa>-<judul>-<platform>_<suara>.mp3`. Hening di awal dan
  akhir rekaman dipangkas otomatis.
- **Dua bahasa antarmuka** (Indonesia / Inggris) lewat toggle di header. Default
  mengikuti bahasa browser; pilihan disimpan.
- **Tema** lewat dropdown: *Ikuti sistem*, *Terang*, *Gelap*. Pilihan disimpan
  dan diterapkan sebelum halaman digambar (tanpa berkedip).
- Peringatan sebelum menyimpan: semua suara yang keluar dari komputer ikut
  terekam.

## Prasyarat

- **Node.js 24** (atau lebih baru) — proyek menyetel `"engines": { "node": ">=24" }`.
- npm (bawaan Node).

Cek versi:

```bash
node -v   # harus v24.x atau lebih baru
```

## Menjalankan

```bash
npm install
npm run dev
```

Buka alamat yang ditampilkan (biasanya `http://localhost:5173`) di
browser apa pun (merekam hanya di Chrome/Edge desktop).

Build produksi:

```bash
npm run build     # hasil di folder dist/
npm run preview   # mencoba hasil build secara lokal
```

> Catatan deploy: `getDisplayMedia` hanya berjalan pada *secure context*
> (HTTPS atau `localhost`). Jadi saat di-deploy, situs wajib HTTPS.

## Cara pakai

1. Tempel tautan artikel Wikipedia, mis. `https://id.wikipedia.org/wiki/Indonesia`,
   lalu klik **Ambil artikel**. Isi artikel tampil di kotak baca-saja.
2. Pilih suara (gunakan filter bahasa bila perlu) dan klik tombol **play** di
   sebelahnya untuk mendengar sample. Atur kecepatan sesuai selera.
3. **Bacakan** memutar suara; **Jeda** dan **Berhenti** mengendalikannya.
4. **Bacakan & Simpan** (hanya Chrome/Edge) membacakan sekaligus merekam agar
   bisa diunduh:
   1. Pada dialog berbagi layar, pilih **Entire Screen** (bukan "Chrome Tab").
   2. Centang **"Also share system audio"**, lalu klik **Share**.
   3. Setelah artikel selesai dibacakan, rekaman berhenti otomatis, hening di
      awal dan akhir dipangkas, lalu tombol **Unduh (mp3)** muncul.

### Query URL (isi otomatis)

Tautan artikel bisa dikirim lewat alamat halaman, sehingga kolom terisi dan
artikel langsung diambil:

- `?url=https://id.wikipedia.org/wiki/Indonesia`
- `&oldid=123456` untuk revisi tertentu
- `&auto=0` hanya mengisi kolom, tanpa langsung mengambil artikel

Contoh: `https://wikisiniar.web.app/?url=https://id.wikipedia.org/wiki/Indonesia`

## Kenapa harus merekam layar untuk menyimpan suara?

Web Speech API (`speechSynthesis`) **tidak menyediakan akses ke data
audionya** — suara diputar langsung oleh sistem operasi dan tidak melewati
audio context browser, sehingga JavaScript tidak bisa menangkap buffer-nya
secara langsung. Satu-satunya jalan murni-browser adalah merekam *system
audio* lewat `getDisplayMedia`.

Konsekuensinya:

- Pengguna harus memilih **Entire Screen** — memilih "Chrome Tab" tidak akan
  merekam apa pun, karena suara TTS bukan bagian dari audio tab.
- **Semua suara sistem ikut terekam** (notifikasi, musik, video, dsb.). Tutup
  aplikasi lain yang bersuara selama perekaman.
- Kode tidak bisa memaksa pilihan pengguna di dialog berbagi
  (`systemAudio: "include"` hanya saran bagi browser).

### Pemangkasan hening & konversi MP3

Suara online (Google/Edge Natural) butuh waktu jaringan sebelum berbunyi,
sehingga awal rekaman cenderung hening. Perekaman tetap dimulai lebih dulu
(agar huruf pertama tidak terpotong), lalu setelah selesai audio didekode,
bagian hening di awal/akhir dipangkas (menyisakan 0,12 dtk sebelum dan 0,35 dtk
sesudah suara), kemudian dikodekan ke MP3 di browser dengan
[`@breezystack/lamejs`](https://www.npmjs.com/package/@breezystack/lamejs).
Jika dekode/enkode gagal, file asli hasil `MediaRecorder` (`.webm`/`.m4a`)
tetap tersedia.

## Dukungan platform untuk "Bacakan & Simpan"

| Platform | Dukungan |
| --- | --- |
| Chrome/Edge di **Windows** | ✅ Didukung penuh |
| Chrome di **ChromeOS** | ✅ Didukung penuh |
| Chrome di **macOS** | ✅ Hanya Chrome 141+ **dan** macOS 14.2+ |
| Chrome di **Linux** | ❌ Tidak (hanya lewat flag eksperimental browser) |
| **Safari**, **Firefox**, browser lain, **Android / iOS** | ❌ Tidak bisa merekam (hanya **Bacakan**) |

Pada platform tanpa dukungan perekaman, tombol **Bacakan** tetap berfungsi
tetapi **Bacakan & Simpan** dinonaktifkan.

## Struktur proyek

```
wikisiniar/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── main.jsx        # entry point React
    ├── App.jsx         # UI, logika TTS, perekaman, tema, bahasa
    ├── ThemeMenu.jsx   # dropdown tema (sistem/terang/gelap)
    ├── i18n.js         # terjemahan Indonesia & Inggris
    ├── support.js      # deteksi browser/perangkat & filter suara
    ├── wiki.js         # validasi URL Wikipedia, ambil & bersihkan artikel
    ├── samples.js      # teks contoh untuk preview suara
    ├── audio.js        # pangkas hening + enkode MP3
    └── index.css       # styling responsif (terang/gelap)
```

## Teknologi

- React 19 + Vite 7
- Web Speech API (`speechSynthesis`) — suara bawaan browser
- API Wikipedia (`action=query` & `action=parse`) — sumber artikel
- Screen Capture API (`getDisplayMedia`) + `MediaRecorder` — penyimpanan audio
- `@breezystack/lamejs` — enkoder MP3 di sisi browser
- Tanpa backend sendiri
