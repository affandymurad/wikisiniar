/* Deteksi browser / perangkat dan penyaringan suara natural. */

const nav = typeof navigator !== "undefined" ? navigator : null;

export const IS_MOBILE =
  !!nav &&
  (/Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(nav.userAgent) ||
    // iPadOS modern menyamar sebagai Mac tapi punya layar sentuh
    (nav.platform === "MacIntel" && nav.maxTouchPoints > 1));

/** Mengembalikan "chrome", "edge", atau "other" (+ nama untuk ditampilkan). */
function detectBrowser() {
  if (!nav) return { id: "other", name: "" };
  const ua = nav.userAgent;
  const brands = (nav.userAgentData?.brands || []).map((b) => b.brand);
  const hasBrand = (re) => brands.some((b) => re.test(b));

  if (/Firefox|FxiOS/i.test(ua)) return { id: "firefox", name: "Firefox" };
  if (/OPR\/|Opera/i.test(ua) || hasBrand(/Opera/i))
    return { id: "other", name: "Opera" };
  if (/Vivaldi/i.test(ua) || hasBrand(/Vivaldi/i))
    return { id: "other", name: "Vivaldi" };
  if (nav.brave || hasBrand(/Brave/i)) return { id: "other", name: "Brave" };
  if (/SamsungBrowser|YaBrowser|UCBrowser/i.test(ua))
    return { id: "other", name: "Browser lain" };

  if (hasBrand(/Microsoft Edge/i) || /\bEdg\//.test(ua))
    return { id: "edge", name: "Microsoft Edge" };

  if (brands.length) {
    return hasBrand(/Google Chrome/i)
      ? { id: "chrome", name: "Google Chrome" }
      : { id: "other", name: "Chromium" };
  }
  if (/\bChrome\//.test(ua)) return { id: "chrome", name: "Google Chrome" };
  if (/Safari\//.test(ua) && /Version\//.test(ua) && !/Chrom|Android/i.test(ua))
    return { id: "safari", name: "Safari" };
  if (/Safari\//.test(ua)) return { id: "other", name: "Safari" };
  return { id: "other", name: "" };
}

export const BROWSER = detectBrowser();
export const IS_SUPPORTED_BROWSER = ["chrome", "edge", "safari", "firefox"].includes(BROWSER.id);

// Hanya Chrome/Edge yang bisa merekam system audio (Firefox tidak mendukungnya).
const CAN_RECORD_BROWSER = BROWSER.id === "chrome" || BROWSER.id === "edge";

export const HAS_SPEECH =
  typeof window !== "undefined" && "speechSynthesis" in window;

const HAS_DISPLAY_MEDIA =
  !!nav?.mediaDevices && typeof nav.mediaDevices.getDisplayMedia === "function";
const HAS_RECORDER = typeof window !== "undefined" && "MediaRecorder" in window;

export const CAN_SAVE =
  !IS_MOBILE && CAN_RECORD_BROWSER && HAS_DISPLAY_MEDIA && HAS_RECORDER;

export const IS_MAC = !!nav && !IS_MOBILE && /Macintosh|Mac OS X/i.test(nav.userAgent);

/** Simpan lewat fitur Speech macOS (klik kanan): hanya Chrome/Edge di Mac. */
export const CAN_SAVE_MAC = IS_MAC && CAN_SAVE;

/**
 * Suara "natural":
 *  - Edge: suara neural "Microsoft … Online (Natural)".
 *  - Chrome: suara jaringan "Google …".
 *  - Safari: Enhanced/Premium/Siri jika ada; bila tidak (umumnya), suara compact lewat isSafariFallbackVoice.
 *  - Firefox: tidak ada penanda kualitas, jadi semua suara bawaan sistem ditampilkan.
 * Di Chrome/Edge, suara lokal OS (SAPI/espeak) dianggap robotik dan disembunyikan.
 */
export function isNaturalVoice(v) {
  // Firefox, mobile, dan browser lain: tidak ada penanda kualitas, tampilkan semua suara.
  if (IS_MOBILE || BROWSER.id === "firefox" || BROWSER.id === "other") return true;
  if (/natural/i.test(v.name)) return true;
  if (BROWSER.id === "chrome") return /^Google\b/i.test(v.name);
  if (BROWSER.id === "safari")
    // Nama bisa tanpa "(Enhanced)"; voiceURI macOS berbentuk com.apple.voice.premium.en-US.Ava
    return /\b(Enhanced|Premium|Siri)\b|\.(enhanced|premium)\./i.test(`${v.name} ${v.voiceURI}`);
  return false;
}

/** Safari tanpa unduhan Enhanced/Premium: suara standar Apple, tanpa novelty/Eloquence. */
export function isSafariFallbackVoice(v) {
  if (BROWSER.id !== "safari") return false;
  return /com\.apple\.(voice|ttsbundle)\./i.test(v.voiceURI || "") &&
    !/eloquence|speech\.synthesis/i.test(v.voiceURI || "");
}

export function baseLang(tag) {
  return tag.split(/[-_]/)[0].toLowerCase();
}
