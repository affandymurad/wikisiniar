export const LANGS = ["id", "en"];

export const translations = {
  id: {
    docTitle: "Wikisiniar — Suara Natural dari Wikipedia",
    brand: "Wikisiniar",
    langSwitch: "Bahasa antarmuka: Indonesia / Inggris",
    themeLabel: "Tema",
    themeSystem: "Ikuti sistem",
    themeLight: "Terang",
    themeDark: "Gelap",

    heroBadge: "Gratis · tanpa login · berjalan di browser",
    heroTitle: "Ubah artikel Wikipedia jadi suara",
    heroTitleEm: "yang terdengar natural.",
    heroLead:
      "Tempel tautan artikel Wikipedia, pilih suara natural, lalu dengarkan atau simpan sebagai file audio. Hanya judul, subjudul, dan isi artikel yang dibacakan.",
    chipBrowser: "Semua browser, desktop & mobile",
    chipNatural: "Suara natural bila tersedia",
    chipSave: "Simpan ke file",
    recoEdge:
      "**Rekomendasi:** setelah beberapa kali percobaan, **Microsoft Edge versi desktop** memberikan kualitas suara (TTS) terbaik: lebih natural, lancar, dan manusiawi dibanding browser lain. Edge desktop juga mendukung fitur merekam & menyimpan suara. Browser lain tetap bisa dipakai untuk mendengarkan, tetapi kualitas suaranya bergantung pada mesin suara masing-masing.",

    // gerbang
    gateEyebrow: "Tidak dapat dilanjutkan",
    gateTitleBrowser: "Browser ini belum didukung",
    gateLeadBrowser:
      "Situs ini hanya dapat digunakan di Google Chrome, Microsoft Edge, Safari, atau Firefox versi desktop. Browser lain belum didukung karena tidak menyediakan suara yang layak.",
    gateTitleMobile: "Buka lewat komputer",
    gateLeadMobile:
      "Situs ini hanya berfungsi di Chrome, Edge, Safari, atau Firefox pada komputer/laptop. Perangkat mobile (Android/iOS) tidak didukung.",
    gateTitleSpeech: "Web Speech API tidak tersedia",
    gateLeadSpeech:
      "Browser Anda tidak menyediakan mesin suara (speechSynthesis). Perbarui browser ke versi terbaru lalu muat ulang halaman.",
    gateTitleNoVoice: "Suara natural tidak ditemukan",
    gateLeadNoVoice:
      "Browser ini belum menyediakan suara yang bisa dipakai. Chrome dan Edge hanya menampilkan suara natural agar hasilnya tidak terdengar robotik.",
    gateTipEdge:
      "**Edge:** suara natural (\"Microsoft … Online (Natural)\") bawaan Edge dan butuh koneksi internet. Perbarui Edge, tunggu beberapa detik, lalu muat ulang.",
    gateTipChrome:
      "**Chrome:** suara \"Google …\" butuh koneksi internet. Pastikan Anda online dan Chrome versi terbaru, lalu muat ulang.",
    gateDetected: "Browser terdeteksi",
    gateTipSafari:
      "**Safari (Mac):** Safari hanya memberi halaman web suara standar (compact) dan tidak menampilkan suara Enhanced/Premium. Jika daftar tetap kosong, tutup Safari sepenuhnya (Cmd+Q), buka lagi, atau gunakan Chrome/Edge untuk suara yang lebih natural.",
    gateTipFirefox:
      "**Firefox:** memakai suara bawaan sistem operasi. Pasang paket suara bahasa yang Anda perlukan di pengaturan sistem (Windows: Waktu & bahasa → Ucapan), lalu muat ulang.",
    gateGetChrome: "Unduh Chrome",
    gateGetEdge: "Unduh Edge",
    gateReload: "Muat ulang halaman",
    loadingVoices: "Memeriksa suara natural di browser ini…",
    browserUnknown: "browser tidak dikenal",
    browserMobile: "perangkat mobile",

    // form
    formEyebrow: "Mulai di sini",
    formTitle: "Tiga langkah singkat",
    formLead: "Pilih suara, tempel tautan Wikipedia, lalu atur kecepatannya.",
    voice: "Pilih suara",
    voiceInfo:
      "Chrome dan Edge desktop hanya menampilkan suara natural; Safari menampilkan suara standar Apple (compact); browser lain dan perangkat mobile menampilkan semua suara bawaan sistem. Gunakan filter bahasa untuk mempersempit daftar.",
    voiceLang: "Bahasa suara",
    voiceName: "Suara",
    allLangs: "Semua bahasa",
    voiceCount: "{n} suara tersedia{lang}.",
    voiceCountLang: " untuk bahasa ini",
    text: "Tautan artikel Wikipedia",
    textInfo: "Semua bahasa didukung selama domainnya *.wikipedia.org. Isi artikel dibacakan per kalimat agar tetap lancar.",
    textPlaceholder: "https://id.wikipedia.org/wiki/Indonesia",
    chars: "{n} karakter",
    previewPlay: "Dengarkan contoh suara ini",
    previewStop: "Hentikan contoh suara",
    fetchBtn: "Ambil artikel",
    fetching: "Mengambil…",
    articleLabel: "Isi artikel (hanya bisa dibaca)",
    articleLoaded: "Artikel dimuat: {title}",
    errEmpty: "Tempel URL artikel Wikipedia terlebih dahulu.",
    errOnlyWiki: "Hanya URL Wikipedia (*.wikipedia.org) yang didukung.",
    errBadUrl: "URL tidak valid.",
    errPortal: "Tempel URL artikel, bukan halaman utama atau portal Wikipedia.",
    errSubdomain: "Subdomain ini bukan Wikipedia berbahasa. Tempel URL artikel dari Wikipedia bahasa tertentu.",
    errMainSpecial: "Tempel URL artikel, bukan halaman utama atau halaman khusus.",
    errNotFound: "Artikel tidak ditemukan.",
    errSpecial: "Tempel URL artikel, bukan halaman khusus.",
    errNs: "Tempel URL artikel (ruang nama utama), bukan halaman Pembicaraan, Pengguna, Kategori, atau halaman khusus.",
    errDisamb: "Ini halaman disambiguasi. Pilih artikel yang spesifik.",
    errEmptyArticle: "Artikel tidak memiliki isi yang bisa dibacakan.",
    errFetch: "Gagal mengambil artikel: {err}",
    recordWarn:
      "**Perhatian saat memakai Bacakan & Simpan:** semua suara yang keluar dari komputer Anda ikut terekam, bukan hanya suara bacaan — termasuk notifikasi, musik, atau video yang sedang diputar. Tutup aplikasi lain yang bersuara dan jangan memutar apa pun sampai rekaman selesai.",
    clear: "Kosongkan",
    tune: "Atur kecepatan",
    tuneInfo: "Geser untuk menyesuaikan; 1× adalah kecepatan normal.",
    rate: "Kecepatan",
    reset: "Reset",

    speak: "Bacakan",
    speakSave: "Bacakan & Simpan",
    recording: "Merekam…",
    stop: "Berhenti",
    pause: "Jeda",
    resume: "Lanjutkan",
    speakSaveTitle: "Membacakan sekaligus merekam system audio agar bisa disimpan",
    noSaveTitle: "Browser/perangkat ini tidak mendukung perekaman system audio",
    noSaveHint:
      "Merekam & menyimpan suara hanya bisa dilakukan di Google Chrome atau Microsoft Edge versi desktop (Windows, ChromeOS, atau Chrome 141+ di macOS 14.2+). Di browser/perangkat ini Anda tetap bisa mendengarkan lewat tombol Bacakan, tetapi Bacakan & Simpan dinonaktifkan.",

    // status
    stEmpty: "Ambil artikel Wikipedia terlebih dahulu.",
    stSpeaking: "Membacakan…",
    stDone: "Selesai.",
    stStopped: "Dihentikan.",
    stError: "Gagal membacakan: {err}",
    stShareHint:
      "Di dialog berbagi: pilih \"Entire Screen\" lalu centang \"Also share system audio\".",
    stShareCancel: "Perekaman dibatalkan (dialog berbagi ditutup).",
    stSurfaceTab:
      "Anda memilih \"Chrome Tab\" — suara TTS tidak termasuk audio tab, hasilnya pasti hening. Ulangi: pilih \"Entire Screen\" lalu centang \"Also share system audio\".",
    stSurfaceWindow:
      "Anda memilih \"Window\" — mode ini tidak menyertakan system audio. Ulangi: pilih \"Entire Screen\" lalu centang \"Also share system audio\".",
    stNoAudio:
      "Tidak ada audio yang dibagikan. Ulangi, pilih \"Entire Screen\", dan centang \"Also share system audio\". (Opsi itu tidak muncul? Berarti browser/OS Anda tidak mendukung — lihat panduan di bawah.)",
    stSilent:
      "Rekaman jadi, tapi terdeteksi HENING. Penyebab umum: system audio tidak ikut dibagikan (ulangi dan centang \"Also share system audio\" pada Entire Screen), volume sistem sedang mute, atau platform ini tidak mendukung.",
    stProcessing: "Rekaman selesai. Sedang memproses menjadi MP3…",
    procHint: "{n}% — mohon tunggu dan jangan tutup tab ini. Artikel panjang bisa memakan waktu beberapa menit.",
    stReady: "Rekaman siap (hening di awal sudah dipangkas). Putar atau unduh di bawah.",
    stEmptyRec: "Rekaman kosong — kemungkinan system audio tidak ikut dibagikan.",
    stRecording: "Merekam & membacakan… jangan tutup dialog berbagi.",

    // hasil
    resultEyebrow: "Hasil",
    resultTitle: "Hasil rekaman",
    download: "Unduh ({ext})",
    resultHint:
      "Format {ext}. Semua suara sistem lain (notifikasi, musik) yang berbunyi selama perekaman ikut terekam.",

    // bantuan
    helpEyebrow: "Panduan",
    helpTitle: "Cara menyimpan suara ke file",
    help1: "Tempel tautan Wikipedia, klik **Ambil artikel**, pilih suara, lalu klik **Bacakan & Simpan**.",
    help2:
      "Pada dialog berbagi layar, pilih tab **Entire Screen** (bukan \"Chrome Tab\").",
    help3: "Centang **\"Also share system audio\"**, lalu klik **Share**.",
    help4:
      "Tunggu sampai teks selesai dibacakan — rekaman berhenti otomatis dan tombol unduh muncul.",
    help5:
      "Pastikan **volume sistem tidak mute** — yang direkam adalah suara yang benar-benar diputar komputer.",
    helpNote:
      "Suara speechSynthesis diputar oleh sistem operasi, bukan oleh tab — karena itu memilih \"Chrome Tab\" tidak akan merekam apa pun. Dukungan perekaman: Chrome/Edge di Windows & ChromeOS; Chrome 141+ di macOS 14.2+.",

    queryEyebrow: "Tautan cepat",
    queryTitle: "Isi otomatis lewat URL",
    queryLead: "Tautan artikel bisa dikirim lewat alamat halaman ini, sehingga kolom terisi dan artikel langsung diambil.",
    queryUrl: "Tautan artikel Wikipedia (wajib).",
    queryOldid: "Opsional: revisi tertentu.",
    queryAuto: "Opsional: hanya mengisi kolom, tanpa langsung mengambil artikel.",
    queryExample: "Contoh:",


    activeVoice: "Suara aktif",
    noVoiceSelected: "Belum ada suara terpilih.",
    footerNote: "Artikel diambil dari API Wikipedia; suara dibuat oleh mesin suara bawaan browser Anda. Tanpa server sendiri, tanpa model eksternal.",
  },

  en: {
    docTitle: "Wikisiniar — Natural Voices from Wikipedia",
    brand: "Wikisiniar",
    langSwitch: "Interface language: Indonesian / English",
    themeLabel: "Theme",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",

    heroBadge: "Free · no login · runs in your browser",
    heroTitle: "Turn Wikipedia articles into speech",
    heroTitleEm: "that sounds natural.",
    heroLead:
      "Paste a Wikipedia article link, pick a natural voice, then listen or save it as an audio file. Only the title, headings, and article body are read.",
    chipBrowser: "All browsers, desktop & mobile",
    chipNatural: "Natural voices when available",
    chipSave: "Save to file",
    recoEdge:
      "**Recommendation:** after several rounds of testing, **Microsoft Edge on desktop** delivers the best text-to-speech (TTS) quality: more natural, fluent, and human-sounding than other browsers. Desktop Edge also supports recording & saving the audio. Other browsers can still be used for listening, but voice quality depends on each browser's own speech engine.",

    gateEyebrow: "Can't continue",
    gateTitleBrowser: "This browser isn't supported",
    gateLeadBrowser:
      "This site only works in desktop Google Chrome, Microsoft Edge, Safari, or Firefox. Other browsers aren't supported because they don't provide usable voices.",
    gateTitleMobile: "Please open on a computer",
    gateLeadMobile:
      "This site only works in Chrome, Edge, Safari, or Firefox on a desktop/laptop. Mobile devices (Android/iOS) are not supported.",
    gateTitleSpeech: "Web Speech API unavailable",
    gateLeadSpeech:
      "Your browser doesn't provide a speech engine (speechSynthesis). Update your browser to the latest version and reload the page.",
    gateTitleNoVoice: "No natural voices found",
    gateLeadNoVoice:
      "This browser doesn't offer any usable voice yet. Chrome and Edge only list natural voices to avoid robotic-sounding output.",
    gateTipEdge:
      "**Edge:** natural voices (\"Microsoft … Online (Natural)\") are built in and need an internet connection. Update Edge, wait a few seconds, then reload.",
    gateTipChrome:
      "**Chrome:** \"Google …\" voices need an internet connection. Make sure you're online and on the latest Chrome, then reload.",
    gateDetected: "Detected browser",
    gateTipSafari:
      "**Safari (Mac):** Safari only gives web pages the standard (compact) voices and does not expose Enhanced/Premium voices. If the list stays empty, fully quit Safari (Cmd+Q) and reopen it, or use Chrome/Edge for more natural voices.",
    gateTipFirefox:
      "**Firefox:** uses your operating system's voices. Install the voice pack for the language you need in system settings (Windows: Time & language → Speech), then reload.",
    gateGetChrome: "Get Chrome",
    gateGetEdge: "Get Edge",
    gateReload: "Reload page",
    loadingVoices: "Checking for natural voices in this browser…",
    browserUnknown: "unknown browser",
    browserMobile: "mobile device",

    formEyebrow: "Start here",
    formTitle: "Three quick steps",
    formLead: "Pick a voice, paste a Wikipedia link, then adjust the speed.",
    voice: "Choose a voice",
    voiceInfo:
      "Desktop Chrome and Edge list natural voices only; Safari lists Apple's standard (compact) voices; other browsers and mobile devices list every voice installed on your system. Use the language filter to narrow the list.",
    voiceLang: "Voice language",
    voiceName: "Voice",
    allLangs: "All languages",
    voiceCount: "{n} voices available{lang}.",
    voiceCountLang: " for this language",
    text: "Wikipedia article link",
    textInfo: "Every language works as long as the domain is *.wikipedia.org. The article is read sentence by sentence to keep playback smooth.",
    textPlaceholder: "https://en.wikipedia.org/wiki/Indonesia",
    chars: "{n} characters",
    previewPlay: "Listen to a sample of this voice",
    previewStop: "Stop the sample",
    fetchBtn: "Fetch article",
    fetching: "Fetching…",
    articleLabel: "Article content (read-only)",
    articleLoaded: "Article loaded: {title}",
    errEmpty: "Paste a Wikipedia article URL first.",
    errOnlyWiki: "Only Wikipedia URLs (*.wikipedia.org) are supported.",
    errBadUrl: "Invalid URL.",
    errPortal: "Paste an article URL, not the Wikipedia main page or portal.",
    errSubdomain: "This subdomain is not a Wikipedia language edition. Paste an article URL from a specific language edition.",
    errMainSpecial: "Paste an article URL, not the main page or a special page.",
    errNotFound: "Article not found.",
    errSpecial: "Paste an article URL, not a special page.",
    errNs: "Paste an article URL (main namespace), not a Talk, User, Category or special page.",
    errDisamb: "This is a disambiguation page. Pick a specific article.",
    errEmptyArticle: "The article has no readable content.",
    errFetch: "Failed to fetch the article: {err}",
    recordWarn:
      "**Heads-up when using Read & Save:** every sound coming out of your computer is recorded, not just the spoken text — including notifications, music, or videos that are playing. Close other apps that make sound and don't play anything until the recording is done.",
    clear: "Clear",
    tune: "Adjust speed",
    tuneInfo: "Drag to adjust; 1× is normal speed.",
    rate: "Speed",
    reset: "Reset",

    speak: "Read aloud",
    speakSave: "Read & Save",
    recording: "Recording…",
    stop: "Stop",
    pause: "Pause",
    resume: "Resume",
    speakSaveTitle: "Reads aloud while recording system audio so it can be saved",
    noSaveTitle: "This browser/device can't record system audio",
    noSaveHint:
      "Recording and saving audio only works in desktop Google Chrome or Microsoft Edge (Windows, ChromeOS, or Chrome 141+ on macOS 14.2+). In this browser/device you can still listen with Read aloud, but Read & Save is disabled.",

    stEmpty: "Fetch a Wikipedia article first.",
    stSpeaking: "Reading aloud…",
    stDone: "Done.",
    stStopped: "Stopped.",
    stError: "Failed to read aloud: {err}",
    stShareHint:
      "In the sharing dialog: choose \"Entire Screen\", then tick \"Also share system audio\".",
    stShareCancel: "Recording cancelled (the sharing dialog was closed).",
    stSurfaceTab:
      "You chose \"Chrome Tab\" — TTS audio isn't part of tab audio, so the result would be silent. Try again: choose \"Entire Screen\" and tick \"Also share system audio\".",
    stSurfaceWindow:
      "You chose \"Window\" — this mode doesn't include system audio. Try again: choose \"Entire Screen\" and tick \"Also share system audio\".",
    stNoAudio:
      "No audio was shared. Try again, choose \"Entire Screen\" and tick \"Also share system audio\". (Option missing? Your browser/OS doesn't support it — see the guide below.)",
    stSilent:
      "The recording was created but sounds SILENT. Common causes: system audio wasn't shared (retry and tick \"Also share system audio\" on Entire Screen), system volume is muted, or this platform isn't supported.",
    stProcessing: "Recording finished. Processing into MP3…",
    procHint: "{n}% — please wait and keep this tab open. Long articles can take a few minutes.",
    stReady: "Recording ready (leading silence trimmed). Play or download it below.",
    stEmptyRec: "Empty recording — system audio was probably not shared.",
    stRecording: "Recording & reading aloud… don't close the sharing dialog.",

    resultEyebrow: "Result",
    resultTitle: "Your recording",
    download: "Download ({ext})",
    resultHint:
      "{ext} format. Any other system sounds (notifications, music) played during recording are captured too.",

    helpEyebrow: "Guide",
    helpTitle: "How to save speech to a file",
    help1: "Paste a Wikipedia link, click **Fetch article**, choose a voice, then click **Read & Save**.",
    help2:
      "In the screen-sharing dialog, pick the **Entire Screen** tab (not \"Chrome Tab\").",
    help3: "Tick **\"Also share system audio\"**, then click **Share**.",
    help4:
      "Wait until the text has been read — recording stops automatically and the download button appears.",
    help5:
      "Make sure the **system volume isn't muted** — what's recorded is the sound your computer actually plays.",
    helpNote:
      "speechSynthesis audio is played by the operating system, not by the tab — so choosing \"Chrome Tab\" records nothing. Recording support: Chrome/Edge on Windows & ChromeOS; Chrome 141+ on macOS 14.2+.",

    queryEyebrow: "Quick link",
    queryTitle: "Auto-fill via URL",
    queryLead: "The article link can be passed in this page's address, so the field is filled in and the article is fetched right away.",
    queryUrl: "Wikipedia article link (required).",
    queryOldid: "Optional: a specific revision.",
    queryAuto: "Optional: only fills the field, without fetching the article.",
    queryExample: "Example:",


    activeVoice: "Active voice",
    noVoiceSelected: "No voice selected yet.",
    footerNote: "Articles come from the Wikipedia API; speech is generated by your browser's built-in voice engine. No server of our own, no external model.",
  },
};

export function makeT(lang) {
  const dict = translations[lang] || translations.id;
  return (key, params) => {
    let s = dict[key] ?? translations.id[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, v);
    }
    return s;
  };
}

export function detectInitialLang() {
  try {
    const saved = localStorage.getItem("language");
    if (LANGS.includes(saved)) return saved;
  } catch {
    /* storage tidak tersedia */
  }
  return (navigator.language || "id").toLowerCase().startsWith("id") ? "id" : "en";
}
