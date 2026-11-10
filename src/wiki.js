/* Ambil artikel Wikipedia: validasi URL, unduh, HTML → Markdown → teks bersih. */

export class WikiError extends Error {
  constructor(key, vars) {
    super(key);
    this.key = key;
    this.vars = vars;
  }
}

const LANG_RE = /^[a-z]{2,12}(?:-[a-z0-9]{2,12}){0,3}$/;
const BLOCKED = new Set(["www", "m", "test", "test2", "abstract", "api", "upload", "login", "beta", "stable", "static", "internal"]);

export function parseWikiUrl(raw) {
  let s = String(raw || "").trim();
  if (!s) throw new WikiError("errEmpty");
  if (!/^https?:\/\//i.test(s)) {
    if (s.includes("://")) throw new WikiError("errOnlyWiki");
    s = "https://" + s;
  }
  let u;
  try {
    u = new URL(s);
  } catch {
    throw new WikiError("errBadUrl");
  }
  if (u.username || u.password || u.port) throw new WikiError("errBadUrl");
  const host = u.hostname.toLowerCase();
  if (host === "wikipedia.org" || host === "www.wikipedia.org") throw new WikiError("errPortal");
  const m = host.match(/^([a-z0-9-]+)(?:\.m)?\.wikipedia\.org$/);
  if (!m) throw new WikiError("errOnlyWiki");
  const lang = m[1];
  if (!LANG_RE.test(lang) || BLOCKED.has(lang)) throw new WikiError("errSubdomain");

  let title = null;
  const p = u.pathname;
  try {
    if (p.startsWith("/wiki/")) title = decodeURIComponent(p.slice(6)).replace(/_/g, " ");
    else if (p === "/w/index.php" || p === "/index.php" || p === "/")
      title = (u.searchParams.get("title") || "").replace(/_/g, " ") || null;
    else throw new WikiError("errMainSpecial");
  } catch (e) {
    if (e instanceof WikiError) throw e;
    throw new WikiError("errBadUrl");
  }
  const od = u.searchParams.get("oldid");
  const cd = u.searchParams.get("curid");
  const oldid = od && /^\d{1,12}$/.test(od) ? od : null;
  const curid = cd && /^\d{1,12}$/.test(cd) ? cd : null;
  title = title ? title.trim() : null;
  if (!title && !oldid && !curid) throw new WikiError("errMainSpecial");
  // API dibangun ulang dari host yang sudah lolos validasi
  return { lang, api: `https://${lang}.wikipedia.org/w/api.php`, title, oldid, curid };
}

async function apiGet(api, params, signal) {
  const qs = new URLSearchParams({ format: "json", formatversion: "2", origin: "*", ...params });
  const res = await fetch(`${api}?${qs}`, { signal });
  if (!res.ok) throw new Error(`Wikipedia API: HTTP ${res.status}`);
  const j = await res.json();
  if (j.error) {
    if (/missingtitle|nosuchpageid|nosuchrevid/.test(j.error.code)) throw new WikiError("errNotFound");
    throw new Error(`Wikipedia API: ${j.error.info || j.error.code}`);
  }
  return j;
}

/* ---------- HTML → Markdown (hanya judul, subjudul, paragraf, daftar) ---------- */

const DROP_SELECTOR = [
  "style", "script", "table", "figure", "img", "sup", "sub", ".reference", ".reflist", ".references",
  ".refbegin", ".navbox", ".navbox-styles", ".hatnote", ".mw-editsection", ".toc", "#toc", ".thumb", ".gallery",
  ".infobox", ".sidebar", ".metadata", ".noprint", ".mw-empty-elt", ".ambox", ".shortdescription",
  ".mw-cite-backlink", ".portal", ".sistersitebox", ".authority-control", ".catlinks", "math", ".mwe-math-element",
  ".IPA", ".rt-commentedText", "audio", "video",
].join(",");

// Bagian penutup yang bukan isi bacaan (id heading, huruf kecil, spasi → _)
const END_SECTIONS = new Set([
  "referensi", "catatan", "catatan_kaki", "pranala_luar", "bacaan_lanjutan", "lihat_pula", "daftar_pustaka", "sumber",
  "references", "notes", "footnotes", "external_links", "further_reading", "see_also", "bibliography", "sources", "citations",
]);

function htmlToMarkdown(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const root = doc.querySelector(".mw-parser-output") || doc.body;
  root.querySelectorAll(DROP_SELECTOR).forEach((el) => el.remove());

  const out = [];
  let skipping = false;
  const inline = (el) => el.textContent.replace(/\s+/g, " ").trim();

  for (const el of root.children) {
    const hd = el.matches?.(".mw-heading") ? el.querySelector("h1,h2,h3,h4,h5,h6") : el;
    if (hd && /^H[1-6]$/.test(hd.tagName)) {
      const id = (hd.id || "").toLowerCase();
      skipping = END_SECTIONS.has(id);
      if (!skipping) out.push("#".repeat(Math.min(+hd.tagName[1], 6)) + " " + inline(hd));
      continue;
    }
    if (skipping) continue;
    if (el.tagName === "P") out.push(inline(el));
    else if (el.tagName === "UL" || el.tagName === "OL") {
      el.querySelectorAll(":scope > li").forEach((li, i) =>
        out.push((el.tagName === "OL" ? `${i + 1}. ` : "- ") + inline(li))
      );
    } else if (el.tagName === "DL" || el.tagName === "BLOCKQUOTE") out.push(inline(el));
  }
  return out.filter(Boolean).join("\n\n");
}

/* ---------- Bersihkan notasi Markdown & sisa Wikipedia ---------- */

function cleanMarkdown(md) {
  const lines = md
    .replace(/[­​-‏‪-‮⁠﻿]/g, "")
    .replace(/ /g, " ")
    .split("\n")
    .map((line) => {
      const isHead = /^#{1,6}\s/.test(line);
      const clean = line
        .replace(/^#{1,6}\s+/, "") // judul
        .replace(/^\s*(?:[-*+]|\d+\.)\s+/, "") // penanda daftar
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // tautan MD
        .replace(/\[(?:\d+|[a-z]|catatan \d+|note \d+|butuh rujukan|citation needed)\]/gi, "") // [1], [a]
        .replace(/(\*\*|__|\*|_|`|~~)/g, "") // tebal/miring/kode
        .replace(/\(\s*[;,]?\s*\)/g, "") // kurung kosong sisa IPA/lahir
        .replace(/\s*\([^()]{0,80}\)/g, "") // keterangan dalam kurung (lahir, ejaan, terjemahan)
        .replace(/\s+([,.;:!?])/g, "$1")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
      return isHead && clean && !/[.!?:]$/.test(clean) ? clean + "." : clean;
    });

  return lines.filter(Boolean).join("\n");
}

/* Dijalankan sebelum pembersihan, selagi penanda judul (#) masih ada. */
function dropEmptySections(md) {
  const parts = md.split("\n\n");
  const res = [];
  for (let i = 0; i < parts.length; i++) {
    if (/^#{2,6} /.test(parts[i])) {
      const next = parts[i + 1];
      if (next === undefined || /^#{1,6} /.test(next)) continue;
    }
    res.push(parts[i]);
  }
  return res.join("\n\n");
}

export async function fetchArticle(info, signal) {
  const q = { action: "query", redirects: "1", prop: "info|pageprops", ppprop: "disambiguation" };
  if (info.oldid) q.revids = info.oldid;
  else if (info.curid) q.pageids = info.curid;
  else q.titles = info.title;
  const qr = await apiGet(info.api, q, signal);
  const page = (qr.query.pages || [])[0];
  if (page?.special) throw new WikiError("errSpecial");
  if (!page || page.missing || page.invalid || qr.query.badrevids) throw new WikiError("errNotFound");
  if (page.ns !== 0) throw new WikiError("errNs");
  if (page.pageprops?.disambiguation !== undefined) throw new WikiError("errDisamb");

  const pq = { action: "parse", prop: "text|displaytitle", disableeditsection: "1", disablelimitreport: "1", disabletoc: "1" };
  if (info.oldid) pq.oldid = info.oldid;
  else pq.pageid = String(page.pageid);
  const pr = await apiGet(info.api, pq, signal);
  const title = pr.parse.title || page.title;

  const md = dropEmptySections(htmlToMarkdown(pr.parse.text));
  const body = cleanMarkdown(md);
  if (!body) throw new WikiError("errEmptyArticle");
  return { title, lang: info.lang, text: `${title}.\n${body}` };
}
