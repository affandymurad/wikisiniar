import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ThemeMenu from "./ThemeMenu.jsx";
import { trimSilence } from "./audio.js";
import { sampleFor } from "./samples.js";
import { WikiError, fetchArticle, parseWikiUrl } from "./wiki.js";
import { LANGS, detectInitialLang, makeT } from "./i18n.js";
import {
  BROWSER,
  CAN_SAVE,
  CAN_SAVE_MAC,
  HAS_SPEECH,
  IS_MOBILE,
  baseLang,
  isNaturalVoice, isSafariFallbackVoice,
} from "./support.js";

/* ---------- Util ---------- */

const ABBR = /(?:^|\s)(?:dr|drs|ir|prof|jl|no|hlm|dll|dsb|dst|tgl|st|mr|mrs|ms|vs|ca|sdr|bpk|ny|kab|kec|kel)\.$/i;
const MIN_CHUNK = 70;
const MAX_CHUNK = 220;

/* Pecah per baris (judul/paragraf), lalu per kalimat tanpa memotong singkatan atau angka
   (mis. "17.508 pulau"). Kalimat pendek digabung agar intonasi mengalir; kalimat panjang
   dipecah di koma agar tidak terpotong oleh bug Chrome. */
function splitChunks(text) {
  const out = [];
  for (const line of text.split("\n")) {
    const raw = line.trim();
    if (!raw) continue;
    const sentences = [];
    for (const part of raw.split(/(?<=[.!?])\s+(?=[\p{Lu}\d"“‘(])/u)) {
      const last = sentences.length - 1;
      if (last >= 0 && ABBR.test(sentences[last])) sentences[last] += " " + part;
      else sentences.push(part);
    }
    let buf = "";
    const flush = () => {
      if (buf) out.push(buf);
      buf = "";
    };
    for (const sen of sentences) {
      if (sen.length > MAX_CHUNK) {
        flush();
        let cur = "";
        for (const piece of sen.split(/(?<=[,;:])\s+/)) {
          if (cur && (cur + " " + piece).length > MAX_CHUNK) {
            out.push(cur);
            cur = piece;
          } else cur = cur ? cur + " " + piece : piece;
        }
        if (cur) out.push(cur);
      } else if (buf && (buf + " " + sen).length <= MAX_CHUNK && buf.length < MIN_CHUNK) {
        buf += " " + sen;
      } else {
        flush();
        buf = sen;
      }
    }
    flush();
  }
  return out;
}

function pickMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const t of candidates) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

/** Suara "Multilingual" (mis. Edge "…Multilingual Online (Natural)") bisa membaca semua bahasa. */
const isMultilingual = (v) => /multilingual/i.test(v.name);

const MANUAL_WAIT_MS = 10000; // batas menunggu suara Speech macOS mulai
const MANUAL_END_SILENCE_MS = 2500; // hening selama ini = bacaan selesai

const voiceKey = (v) => `${v.voiceURI}|${v.name}|${v.lang}`;

/** Render **tebal** di dalam string terjemahan. */
function rich(str) {
  return str
    .split("**")
    .map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
}

function readStored(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* abaikan */
  }
}

/* ---------- Komponen kecil ---------- */

function Gate({ t, reason, onReload }) {
  const browserLabel = IS_MOBILE
    ? t("browserMobile")
    : BROWSER.name || t("browserUnknown");
  const titleKey = {
    speech: "gateTitleSpeech",
    voice: "gateTitleNoVoice",
  }[reason];
  const leadKey = {
    speech: "gateLeadSpeech",
    voice: "gateLeadNoVoice",
  }[reason];

  return (
    <section className="card gate" role="alert">
      <div className="gate-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </div>
      <div className="eyebrow">{t("gateEyebrow")}</div>
      <h2>{t(titleKey)}</h2>
      <p className="lead-sm">{t(leadKey)}</p>

      {reason === "voice" && (
        <ul className="tips">
          <li>{rich(t("gateTipEdge"))}</li>
          <li>{rich(t("gateTipChrome"))}</li>
          <li>{rich(t("gateTipSafari"))}</li>
          <li>{rich(t("gateTipFirefox"))}</li>
        </ul>
      )}

      <p className="detected">
        {t("gateDetected")}: <b>{browserLabel}</b>
      </p>

      <div className="gate-actions">
        {reason === "voice" || reason === "speech" ? (
          <button type="button" className="btn btn-primary" onClick={onReload}>
            {t("gateReload")}
          </button>
        ) : (
          <>
            <a
              className="btn btn-primary"
              href="https://www.google.com/chrome/"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("gateGetChrome")}
            </a>
            <a
              className="btn btn-ghost"
              href="https://www.microsoft.com/edge"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("gateGetEdge")}
            </a>
          </>
        )}
      </div>
    </section>
  );
}

function fileSafe(s) {
  return s.trim().replace(/[\\/:*?"<>|\x00-\x1f]/g, "").replace(/\s+/g, "_").slice(0, 120);
}

/* ---------- Komponen utama ---------- */

export default function App() {
  const [lang, setLang] = useState(detectInitialLang);
  const [theme, setTheme] = useState(() => readStored("theme", "system"));

  const [voices, setVoices] = useState([]);
  const [voicesTimedOut, setVoicesTimedOut] = useState(false);
  const [langFilter, setLangFilter] = useState(null); // null = otomatis
  const [selectedKey, setSelectedKey] = useState("");
  const [text, setText] = useState("");
  const [wikiUrl, setWikiUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [paused, setPaused] = useState(false);
  const [article, setArticle] = useState(null); // { lang, title }
  const [rate, setRate] = useState(1);
  const [status, setStatus] = useState(null); // { k, p, tone }
  const [procPct, setProcPct] = useState(null); // 0..100 saat memproses rekaman, else null
  const [speaking, setSpeaking] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioMime, setAudioMime] = useState("audio/webm");

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioUrlRef = useRef(null);
  const previewIdRef = useRef(0);
  const articleRef = useRef(null);

  const t = useMemo(() => makeT(lang), [lang]);
  /* Query URL: ?url=<artikel>&oldid=<revisi>&auto=0 (auto=0 hanya mengisi kolom) */
  const queryDone = useRef(false);
  useEffect(() => {
    if (queryDone.current) return;
    queryDone.current = true;
    const q = new URLSearchParams(window.location.search);
    let raw = (q.get("url") || "").trim();
    if (!raw) return;
    const oldid = q.get("oldid");
    if (oldid && /^\d{1,12}$/.test(oldid) && !/[?&]oldid=/.test(raw))
      raw += (raw.includes("?") ? "&" : "?") + "oldid=" + oldid;
    setWikiUrl(raw);
    if (q.get("auto") !== "0") fetchFrom(raw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [downloadName, setDownloadName] = useState("Wikisiniar-Wikipedia");

  const say = (k, p, tone = "info") => setStatus({ k, p, tone });

  const handleSelectAll = () => {
    const el = articleRef.current;
    if (!el) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      say("copied", null, "ok");
    } catch {
      handleSelectAll();
      say("stCopyFail", null, "warn");
    }
  };

  const handleFetch = (e) => {
    e?.preventDefault();
    return fetchFrom(wikiUrl);
  };

  const fetchFrom = async (raw) => {
    let info;
    try {
      info = parseWikiUrl(raw);
    } catch (err) {
      say(err.key || "errBadUrl", err.vars, "warn");
      return;
    }
    setFetching(true);
    say("fetching");
    try {
      const art = await fetchArticle(info);
      setText(art.text);
      setArticle({ lang: art.lang, title: art.title });
      setLangFilter(art.lang.split("-")[0]);
      say("articleLoaded", { title: art.title }, "ok");
    } catch (err) {
      if (err instanceof WikiError) say(err.key, err.vars, "warn");
      else say("errFetch", { err: err.message }, "error");
    } finally {
      setFetching(false);
    }
  };

  const blockReason = !HAS_SPEECH ? "speech" : null;

  /* ----- Bahasa antarmuka ----- */
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t("docTitle");
    writeStored("language", lang);
  }, [lang, t]);

  /* ----- Tema ----- */
  useEffect(() => {
    writeStored("theme", theme);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && mq.matches);
      document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    };
    apply();
    if (theme !== "system") return;
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  /* ----- Muat daftar suara (hanya yang natural) ----- */
  useEffect(() => {
    if (blockReason) return;
    const synth = window.speechSynthesis;

    const load = () => {
      const all = synth.getVoices();
      let natural = all.filter(isNaturalVoice);
      // Safari tanpa suara Enhanced/Premium: pakai suara standar Apple (bukan novelty/Eloquence).
      if (!natural.length) {
        const std = all.filter(isSafariFallbackVoice);
        // Buang versi super-compact bila versi compact (lebih bagus) dengan suara yang sama ada.
        const key = (v) => `${v.lang}|${v.name}`;
        const compact = new Set(std.filter((v) => /\.compact\./.test(v.voiceURI)).map(key));
        natural = std.filter((v) => !/super-compact/.test(v.voiceURI) || !compact.has(key(v)));
      }
      if (!natural.length) return;
      natural.sort(
        (a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name)
      );
      setVoices((prev) =>
        prev.length === natural.length && prev.every((v, i) => v.voiceURI === natural[i].voiceURI)
          ? prev
          : natural
      );
    };

    load();
    synth.addEventListener("voiceschanged", load);
    // Safari sering tidak memicu "voiceschanged" sama sekali; cek berkala sampai suara muncul.
    const poll = setInterval(load, 500);
    const stopPoll = setTimeout(() => clearInterval(poll), 8000);
    // Suara online kadang datang terlambat; beri waktu sebelum menyatakan "tidak ada".
    const timer = setTimeout(() => setVoicesTimedOut(true), 4000);
    return () => {
      synth.removeEventListener("voiceschanged", load);
      clearTimeout(timer);
      clearInterval(poll);
      clearTimeout(stopPoll);
    };
  }, [blockReason]);

  /* ----- Cegah tab tertutup tak sengaja saat rekaman diproses ----- */
  useEffect(() => {
    if (procPct === null) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [procPct !== null]);

  /* ----- Bersihkan saat unmount ----- */
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      stopEverything();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ----- Filter bahasa suara ----- */
  const langOptions = useMemo(() => {
    const codes = [...new Set(voices.map((v) => baseLang(v.lang)))];
    let dn = null;
    try {
      dn = new Intl.DisplayNames([lang], { type: "language" });
    } catch {
      /* Intl.DisplayNames tidak tersedia */
    }
    const label = (c) => {
      try {
        return dn?.of(c) || c;
      } catch {
        return c;
      }
    };
    return codes
      .map((c) => ({ code: c, label: label(c) }))
      .sort((a, b) => a.label.localeCompare(b.label, lang));
  }, [voices, lang]);

  const effectiveFilter = useMemo(() => {
    if (langFilter && (langFilter === "all" || langOptions.some((o) => o.code === langFilter)))
      return langFilter;
    return langOptions.some((o) => o.code === lang) ? lang : "all";
  }, [langFilter, langOptions, lang]);

  const filteredVoices = useMemo(
    () =>
      effectiveFilter === "all"
        ? voices
        : voices.filter((v) => baseLang(v.lang) === effectiveFilter || isMultilingual(v)),
    [voices, effectiveFilter]
  );

  // Suara multilingual dikunci ke bahasa suara yang dipilih (filter "Bahasa suara"),
  // supaya tidak berpindah aksen saat bertemu kata serapan.
  const speechLang = (v) =>
    isMultilingual(v) && effectiveFilter !== "all" ? effectiveFilter : v.lang;

  const selectedVoice =
    filteredVoices.find((v) => voiceKey(v) === selectedKey) || filteredVoices[0];

  /* ----- Audio hasil rekaman ----- */
  const setNewAudioUrl = useCallback((blob) => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    const url = URL.createObjectURL(blob);
    audioUrlRef.current = url;
    setAudioMime(blob.type || "audio/webm");
    setAudioUrl(url);
  }, []);

  /* ----- Mesin bicara ----- */
  const speak = useCallback(
    (onAllDone) => {
      const synth = window.speechSynthesis;
      const trimmed = text.trim();
      if (!trimmed) {
        say("stEmpty", null, "warn");
        return false;
      }
      previewIdRef.current++;
      setPreviewing(false);
      synth.cancel();

      const chunks = splitChunks(trimmed);
      let failed = false;

      chunks.forEach((s, i) => {
        const u = new SpeechSynthesisUtterance(s);
        if (selectedVoice) {
          u.voice = selectedVoice;
          u.lang = speechLang(selectedVoice);
        }
        u.rate = rate;
        u.onerror = (e) => {
          if (e.error !== "canceled" && e.error !== "interrupted") {
            failed = true;
            say("stError", { err: e.error }, "error");
            setSpeaking(false);
            onAllDone?.(false);
          }
        };
        if (i === chunks.length - 1) {
          u.onend = () => {
            if (failed) return;
            setSpeaking(false);
            say("stDone", null, "ok");
            onAllDone?.(true);
          };
        }
        synth.speak(u);
      });

      setSpeaking(true);
      say("stSpeaking");
      return true;
    },
    [text, selectedVoice, rate]
  );

  const stopEverything = useCallback(() => {
    if (HAS_SPEECH) window.speechSynthesis.cancel();
    previewIdRef.current++;
    setPreviewing(false);
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setSpeaking(false);
  }, []);

  const handlePreview = () => {
    const synth = window.speechSynthesis;
    const wasPlaying = previewing;
    const id = ++previewIdRef.current;
    synth.cancel();
    if (wasPlaying || !selectedVoice) {
      setPreviewing(false);
      return;
    }
    setSpeaking(false);
    const u = new SpeechSynthesisUtterance(sampleFor(speechLang(selectedVoice)));
    u.voice = selectedVoice;
    u.lang = speechLang(selectedVoice);
    u.rate = rate;
    const done = () => {
      if (previewIdRef.current === id) setPreviewing(false);
    };
    u.onend = done;
    u.onerror = done;
    setPreviewing(true);
    synth.speak(u);
  };

  const handlePause = () => {
    const synth = window.speechSynthesis;
    if (paused) synth.resume();
    else synth.pause();
    setPaused(!paused);
  };

  useEffect(() => {
    if (!speaking && HAS_SPEECH) {
      setPaused(false);
      window.speechSynthesis.resume();
    }
  }, [speaking]);

  const handleStop = () => {
    stopEverything();
    say("stStopped");
  };

  /* ----- Bacakan + rekam system audio + simpan ----- */
  const handleSpeakAndRecord = async (manual = false) => {
    if (!CAN_SAVE) return;
    const rawVoice = (selectedVoice?.name || "").split(" - ")[0].replace(/\s*Online\s*\(Natural\)/i, "");
    const platform = (rawVoice.match(/^(Microsoft|Google|Apple)\b/i)?.[1] || "").trim();
    const shortName = rawVoice.replace(/^(Microsoft|Google|Apple)\s+/i, "");
    // Mode Speech macOS: suara dipilih di sistem, bukan di dropdown
    const voiceName =
      manual === true
        ? "Apple_Personal_Voice"
        : [platform || BROWSER.name, shortName].filter(Boolean).map(fileSafe).join("_");
    setDownloadName(
      ["Wikisiniar-Wikipedia", article?.lang, article && fileSafe(article.title), voiceName && fileSafe(voiceName)]
        .filter(Boolean)
        .join("-")
    );
    if (!text.trim()) {
      say("stEmpty", null, "warn");
      return;
    }

    say("stShareHint");

    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        // displaySurface: "monitor" membuat dialog langsung membuka tab
        // "Entire Screen" — satu-satunya mode yang menyertakan system audio.
        video: { displaySurface: "monitor" },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        systemAudio: "include", // hanya "saran" bagi browser, bukan paksaan
        selfBrowserSurface: "include",
      });
    } catch {
      say("stShareCancel", null, "warn");
      return;
    }

    // Tolak kalau pengguna memilih Tab/Window: suara speechSynthesis
    // diputar oleh OS, bukan oleh tab, jadi hasilnya PASTI hening.
    const surface = stream.getVideoTracks()[0]?.getSettings?.().displaySurface;
    if (surface === "browser" || surface === "window") {
      stream.getTracks().forEach((tr) => tr.stop());
      say(surface === "browser" ? "stSurfaceTab" : "stSurfaceWindow", null, "error");
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) {
      stream.getTracks().forEach((tr) => tr.stop());
      say("stNoAudio", null, "error");
      return;
    }

    // Pengukur level: deteksi kalau yang terekam ternyata hening total.
    let audioCtx = null;
    let meterTimer = null;
    let peak = 0;
    let heardAt = 0;
    let cancelled = false;
    const startedAt = Date.now();
    try {
      audioCtx = new AudioContext();
      const src = audioCtx.createMediaStreamSource(new MediaStream(audioTracks));
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      meterTimer = setInterval(() => {
        analyser.getFloatTimeDomainData(buf);
        let tickPeak = 0;
        for (let i = 0; i < buf.length; i++) {
          const a = Math.abs(buf[i]);
          if (a > tickPeak) tickPeak = a;
        }
        if (tickPeak > peak) peak = tickPeak;
        if (!manual) return;
        // Mode Speech macOS: tunggu suara mulai (maks 5 dtk), berhenti otomatis saat suara berhenti
        const now = Date.now();
        if (tickPeak > 0.01) {
          if (!heardAt) say("stManualHeard");
          heardAt = now;
        }
        if (!heardAt && now - startedAt > MANUAL_WAIT_MS) {
          cancelled = true;
          if (recorder.state !== "inactive") recorder.stop();
        } else if (heardAt && now - heardAt > MANUAL_END_SILENCE_MS) {
          if (recorder.state !== "inactive") recorder.stop();
        }
      }, 100);
    } catch {
      /* pengukur bersifat opsional */
    }

    streamRef.current = stream;
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(
      new MediaStream(audioTracks),
      mimeType ? { mimeType } : undefined
    );
    recorderRef.current = recorder;

    const parts = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) parts.push(e.data);
    };
    recorder.onstop = () => {
      if (meterTimer) clearInterval(meterTimer);
      audioCtx?.close().catch(() => {});
      stream.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      recorderRef.current = null;
      setRecording(false);
      if (cancelled) {
        say("stManualTimeout", null, "warn");
        return;
      }
      if (parts.length) {
        say("stProcessing");
        setProcPct(0);
        trimSilence(new Blob(parts, { type: mimeType || "audio/webm" }), (f) =>
          setProcPct(Math.round(f * 100))
        ).then(
          ({ blob, silent }) => {
            setProcPct(null);
            setNewAudioUrl(blob);
            if (silent || peak < 0.01) say("stSilent", null, "warn");
            else say("stReady", null, "ok");
          }
        );
      } else {
        say("stEmptyRec", null, "warn");
      }
    };

    // Kalau pengguna menghentikan share lewat UI browser, hentikan semuanya
    audioTracks[0].addEventListener("ended", () => {
      if (recorder.state !== "inactive") recorder.stop();
      window.speechSynthesis.cancel();
      setSpeaking(false);
    });

    recorder.start();
    setRecording(true);

    if (manual) {
      say("stManualWait");
      return;
    }

    const ok = speak((success) => {
      // Jeda singkat supaya ekor suara tidak terpotong
      setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, success ? 400 : 0);
    });

    if (!ok) recorder.stop();
    else say("stRecording");
  };

  const downloadExt = audioMime.includes("ogg")
    ? "ogg"
    : audioMime.includes("mp4")
      ? "m4a"
      : "webm";
  const noVoices = !voices.length;
  const gateReason =
    blockReason || (noVoices && voicesTimedOut ? "voice" : null);
  const loadingVoices = !blockReason && noVoices && !voicesTimedOut;
  const disabled = !!gateReason || loadingVoices;

  const voiceCountText = t("voiceCount", {
    n: filteredVoices.length,
    lang: effectiveFilter === "all" ? "" : t("voiceCountLang"),
  });

  return (
    <>
      <header className="site-header">
        <div className="wrap nav">
          <a className="logo" href="#top" aria-label={t("brand")}>
            <i>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 10v4M7 7v10M11 4v16M15 8v8M19 10.5v3" />
              </svg>
            </i>
            <span>{t("brand")}</span>
          </a>

          <div className="tools">
            <ThemeMenu value={theme} onChange={setTheme} t={t} />
            <button
              type="button"
              className="switch"
              role="switch"
              aria-checked={lang === "en"}
              aria-label={t("langSwitch")}
              title={t("langSwitch")}
              onClick={() => setLang(lang === "id" ? "en" : "id")}
            >
              <i />
              <span>{LANGS[0].toUpperCase()}</span>
              <span>{LANGS[1].toUpperCase()}</span>
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="wrap">
        <section className="hero">
          <span className="badge">● {t("heroBadge")}</span>
          <h1>
            {t("heroTitle")} <em>{t("heroTitleEm")}</em>
          </h1>
          <p className="lead">{t("heroLead")}</p>
          <div className="chips">
            <span>{t("chipBrowser")}</span>
            <span>{t("chipNatural")}</span>
            <span>{t("chipSave")}</span>
          </div>
          <p className="reco">{rich(t("recoEdge"))}</p>
        </section>

        {gateReason && (
          <Gate t={t} reason={gateReason} onReload={() => location.reload()} />
        )}

        {loadingVoices && (
          <div className="card loading" role="status">
            <span className="spinner" aria-hidden="true" />
            {t("loadingVoices")}
          </div>
        )}

        {!disabled && (
          <section className="card form-section" aria-labelledby="form-title">
            <div className="form-head">
              <div className="eyebrow">{t("formEyebrow")}</div>
              <h2 id="form-title">{t("formTitle")}</h2>
              <p>{t("formLead")}</p>
            </div>

            {/* 1. Suara */}
            <div className="step">
              <div className="step-title">{t("voice")}</div>
              <p className="field-info">{t("voiceInfo")}</p>
              <div className="voice-row">
                <label className="field">
                  <span className="sub-label">{t("voiceLang")}</span>
                  <span className="select-wrap">
                    <select
                      value={effectiveFilter}
                      onChange={(e) => setLangFilter(e.target.value)}
                    >
                      <option value="all">{t("allLangs")}</option>
                      {langOptions.map((o) => (
                        <option key={o.code} value={o.code}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
                <div className="field">
                  <label className="sub-label" htmlFor="voice-select">
                    {t("voiceName")}
                  </label>
                  <div className="voice-pick">
                    <span className="select-wrap">
                      <select
                        id="voice-select"
                        value={selectedVoice ? voiceKey(selectedVoice) : ""}
                        onChange={(e) => {
                          setSelectedKey(e.target.value);
                          if (previewing) {
                            previewIdRef.current++;
                            window.speechSynthesis.cancel();
                            setPreviewing(false);
                          }
                        }}
                      >
                        {filteredVoices.map((v) => (
                          <option key={voiceKey(v)} value={voiceKey(v)}>
                            {v.name} — {v.lang}
                          </option>
                        ))}
                      </select>
                    </span>
                    <button
                      type="button"
                      className={`icon-play${previewing ? " on" : ""}`}
                      onClick={handlePreview}
                      disabled={!selectedVoice || recording || speaking}
                      aria-pressed={previewing}
                      aria-label={previewing ? t("previewStop") : t("previewPlay")}
                      title={previewing ? t("previewStop") : t("previewPlay")}
                    >
                      {previewing ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="ico">
                          <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="ico fill">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <p className="hint-line">{voiceCountText}</p>
            </div>

            {/* 2. Teks */}
            <div className="step">
              <label className="step-title" htmlFor="tts-text">
                {t("text")}
              </label>
              <p className="field-info">{t("textInfo")}</p>
              <form className="url-row" onSubmit={handleFetch}>
                <input
                  id="tts-text"
                  type="url"
                  inputMode="url"
                  spellCheck={false}
                  value={wikiUrl}
                  placeholder={t("textPlaceholder")}
                  onChange={(e) => setWikiUrl(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={fetching || !wikiUrl.trim()}>
                  {fetching ? t("fetching") : t("fetchBtn")}
                </button>
              </form>
              <div
                ref={articleRef}
                className="article-view"
                tabIndex={0}
                role="document"
                aria-label={t("articleLabel")}
                data-placeholder={t("articleLabel")}
              >
                {text}
              </div>
              <div className="text-tools">
                <span className="hint-line">{t("chars", { n: text.length.toLocaleString(lang) })}</span>
                <span className="spacer" />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleSelectAll}
                  disabled={!text}
                >
                  {t("selectAll")}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleCopy}
                  disabled={!text}
                >
                  {t("copy")}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setText("");
                    setArticle(null);
                  }}
                  disabled={!text || speaking || recording}
                >
                  {t("clear")}
                </button>
              </div>
              <p className="note note-warn" role="note">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="ico">
                  <path d="M12 3 2 20h20zM12 10v4M12 17v.01" />
                </svg>
                <span>{rich(t("recordWarn"))}</span>
              </p>
            </div>

            {/* 3. Kecepatan */}
            <div className="step">
              <div className="step-title">{t("tune")}</div>
              <p className="field-info">{t("tuneInfo")}</p>
              <div className="sliders">
                <label className="field">
                  <span className="slider-label">
                    {t("rate")} <code>{rate.toFixed(1)}×</code>
                  </span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value))}
                  />
                </label>
              </div>
              {rate !== 1 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm reset"
                  onClick={() => setRate(1)}
                >
                  {t("reset")}
                </button>
              )}
            </div>

            <div className="actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => speak()}
                disabled={recording}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="ico">
                  <path d="M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
                </svg>
                {t("speak")}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handlePause}
                disabled={!speaking}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="ico">
                  {paused ? <path d="M8 5v14l11-7z" /> : <path d="M8 5v14M16 5v14" />}
                </svg>
                {paused ? t("resume") : t("pause")}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleStop}
                disabled={!speaking && !recording}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="ico">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                {t("stop")}
              </button>
            </div>

            <div className="actions actions-save">
              <button
                type="button"
                className="btn btn-accent btn-wide"
                onClick={() => handleSpeakAndRecord(false)}
                disabled={!CAN_SAVE || recording || speaking}
                title={CAN_SAVE ? t("speakSaveTitle") : t("noSaveTitle")}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="ico">
                  <path d="M12 3v12M7 11l5 5 5-5M5 20h14" />
                </svg>
                {recording ? t("recording") : t("speakSave")}
              </button>
              {CAN_SAVE_MAC && (
                <button
                  type="button"
                  className="btn btn-accent btn-wide"
                  onClick={() => handleSpeakAndRecord(true)}
                  disabled={!text || recording || speaking}
                  title={t("speakSaveMacTitle")}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="ico">
                    <path d="M12 3v12M7 11l5 5 5-5M5 20h14" />
                  </svg>
                  {t("speakSaveMac")}
                </button>
              )}
            </div>
            {CAN_SAVE_MAC && <p className="note">{rich(t("speakSaveMacHint"))}</p>}

            {!CAN_SAVE && <p className="note">{t("noSaveHint")}</p>}

            <div
              className={`status status-${status?.tone || "info"}${status ? " has" : ""}`}
              aria-live="polite"
            >
              {recording && <span className="rec-dot" aria-hidden="true" />}
              {procPct !== null && <span className="spinner" aria-hidden="true" />}
              <div className="status-body">
                {status ? t(status.k, status.p) : ""}
                {procPct !== null && (
                  <>
                    <div
                      className="progress"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={procPct}
                    >
                      <span style={{ width: `${procPct}%` }} />
                    </div>
                    <small>{t("procHint", { n: procPct })}</small>
                  </>
                )}
              </div>
            </div>

            {audioUrl && (
              <div className="result">
                <div className="eyebrow">{t("resultEyebrow")}</div>
                <h3>{t("resultTitle")}</h3>
                <audio controls src={audioUrl} />
                <a
                  className="btn btn-primary"
                  href={audioUrl}
                  download={`${downloadName}.${downloadExt}`}
                >
                  {t("download", { ext: downloadExt })}
                </a>
                <p className="hint-line">
                  {t("resultHint", { ext: downloadExt.toUpperCase() })}
                </p>
              </div>
            )}
          </section>
        )}

        {!gateReason && (
          <section className="card help">
            <div className="eyebrow">{t("helpEyebrow")}</div>
            <h2>{t("helpTitle")}</h2>
            <ol className="steps-list">
              {["help1", "help2", "help3", "help4", "help5"].map((k) => (
                <li key={k}>{rich(t(k))}</li>
              ))}
            </ol>
            <p className="note">{t("helpNote")}</p>
          </section>
        )}

        {!gateReason && (
          <section className="card help query-help">
            <div className="eyebrow">{t("queryEyebrow")}</div>
            <h2>{t("queryTitle")}</h2>
            <p className="lead-sm">{t("queryLead")}</p>
            <ul className="query-list">
              <li>
                <code>?url=https://id.wikipedia.org/wiki/Indonesia</code>
                <span>{t("queryUrl")}</span>
              </li>
              <li>
                <code>&amp;oldid=123456</code>
                <span>{t("queryOldid")}</span>
              </li>
              <li>
                <code>&amp;auto=0</code>
                <span>{t("queryAuto")}</span>
              </li>
            </ul>
            <p className="note">
              {t("queryExample")}{" "}
              <code>{window.location.origin}/?url=https://id.wikipedia.org/wiki/Indonesia</code>
            </p>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <div>
            {selectedVoice
              ? `${t("activeVoice")}: ${selectedVoice.name} — ${selectedVoice.lang}`
              : t("noVoiceSelected")}
          </div>
          <div>{t("footerNote")}</div>
        </div>
      </footer>
    </>
  );
}
