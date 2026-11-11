/* Inti pemangkasan hening + enkode OGG (Opus). Dijalankan di Web Worker.
   Opus dikodekan oleh WebCodecs (AudioEncoder, bawaan Chrome/Edge), lalu dibungkus
   wadah Ogg di sini. Tanpa pustaka tambahan. */

const THRESHOLD = 0.01; // amplitudo dianggap "ada suara"
const PRE_ROLL = 0.12; // detik disisakan sebelum suara pertama
const POST_ROLL = 0.35; // detik disisakan setelah suara terakhir
const BITRATE = 96000;
const OPUS_RATE = 48000;
const FRAME = 960; // 20 ms pada 48 kHz
const DEFAULT_PRESKIP = 312;

/* ---------- Ogg ---------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let r = i << 24;
    for (let j = 0; j < 8; j++) r = r & 0x80000000 ? (r << 1) ^ 0x04c11db7 : r << 1;
    t[i] = r >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let crc = 0;
  for (let i = 0; i < bytes.length; i++) crc = ((crc << 8) ^ CRC_TABLE[((crc >>> 24) ^ bytes[i]) & 0xff]) >>> 0;
  return crc >>> 0;
}

/** Satu halaman Ogg berisi paket-paket utuh. */
function makePage(packets, { granule, serial, seq, flags }) {
  const segs = [];
  for (const p of packets) {
    let n = p.length;
    while (n >= 255) {
      segs.push(255);
      n -= 255;
    }
    segs.push(n);
  }
  const body = packets.reduce((a, p) => a + p.length, 0);
  const page = new Uint8Array(27 + segs.length + body);
  const dv = new DataView(page.buffer);
  page.set([0x4f, 0x67, 0x67, 0x53, 0, flags]); // "OggS", versi 0, flag
  dv.setBigUint64(6, BigInt(granule), true);
  dv.setUint32(14, serial, true);
  dv.setUint32(18, seq, true);
  page[26] = segs.length;
  page.set(segs, 27);
  let o = 27 + segs.length;
  for (const p of packets) {
    page.set(p, o);
    o += p.length;
  }
  dv.setUint32(22, crc32(page), true);
  return page;
}

function opusHead(channels, preSkip) {
  const h = new Uint8Array(19);
  h.set([0x4f, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64, 1, channels]); // "OpusHead"
  new DataView(h.buffer).setUint16(10, preSkip, true);
  new DataView(h.buffer).setUint32(12, OPUS_RATE, true);
  return h; // gain 0, mapping family 0
}

function opusTags() {
  const vendor = new TextEncoder().encode("Wikisiniar");
  const t = new Uint8Array(8 + 4 + vendor.length + 4);
  t.set([0x4f, 0x70, 0x75, 0x73, 0x54, 0x61, 0x67, 0x73]); // "OpusTags"
  const dv = new DataView(t.buffer);
  dv.setUint32(8, vendor.length, true);
  t.set(vendor, 12);
  dv.setUint32(12 + vendor.length, 0, true);
  return t;
}

/* ---------- Olah sinyal ---------- */

function resample(ch, from, to) {
  if (from === to) return ch;
  const n = Math.round((ch.length * to) / from);
  const out = new Float32Array(n);
  const ratio = from / to;
  for (let i = 0; i < n; i++) {
    const x = i * ratio;
    const i0 = Math.floor(x);
    const f = x - i0;
    out[i] = ch[i0] * (1 - f) + (ch[Math.min(i0 + 1, ch.length - 1)] ?? 0) * f;
  }
  return out;
}

/**
 * @param {Float32Array[]} data  1–2 kanal
 * @param {(fraction:number)=>void} onProgress
 * @returns {Promise<{silent:true} | {silent:false, chunks:Uint8Array[]}>}
 */
export async function trimAndEncode(data, sr, onProgress) {
  if (typeof AudioEncoder === "undefined") throw new Error("AudioEncoder tidak tersedia");

  const len = data[0].length;
  const loud = (i) => data.some((ch) => Math.abs(ch[i]) > THRESHOLD);
  let first = 0;
  while (first < len && !loud(first)) first++;
  if (first >= len) return { silent: true };
  let last = len - 1;
  while (last > first && !loud(last)) last--;

  const start = Math.max(0, first - Math.round(PRE_ROLL * sr));
  const end = Math.min(len, last + Math.round(POST_ROLL * sr));
  const nCh = data.length;
  const pcm = data.map((ch) => resample(ch.subarray(start, end), sr, OPUS_RATE));
  const total = pcm[0].length;

  const packets = [];
  let preSkip = DEFAULT_PRESKIP;
  let encError = null;
  const encoder = new AudioEncoder({
    output: (chunk, meta) => {
      const desc = meta?.decoderConfig?.description;
      if (desc && desc.byteLength >= 12) {
        const d = new Uint8Array(desc.buffer || desc, desc.byteOffset || 0, desc.byteLength);
        if (d[0] === 0x4f && d[1] === 0x70) preSkip = d[10] | (d[11] << 8);
      }
      const buf = new Uint8Array(chunk.byteLength);
      chunk.copyTo(buf);
      packets.push(buf);
    },
    error: (e) => {
      encError = e;
    },
  });
  encoder.configure({ codec: "opus", sampleRate: OPUS_RATE, numberOfChannels: nCh, bitrate: BITRATE });

  const STEP = FRAME * 50; // 1 detik per suapan
  let lastReport = -1;
  for (let i = 0; i < total; i += STEP) {
    const n = Math.min(STEP, total - i);
    const planar = new Float32Array(n * nCh);
    for (let c = 0; c < nCh; c++) planar.set(pcm[c].subarray(i, i + n), c * n);
    const ad = new AudioData({
      format: "f32-planar",
      sampleRate: OPUS_RATE,
      numberOfFrames: n,
      numberOfChannels: nCh,
      timestamp: Math.round((i / OPUS_RATE) * 1e6),
      data: planar,
    });
    encoder.encode(ad);
    ad.close();
    if (encError) throw encError;
    // jangan menumpuk antrean terlalu panjang
    while (encoder.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 0));
    const pct = Math.floor((i / total) * 100);
    if (pct !== lastReport) {
      lastReport = pct;
      onProgress?.(pct / 100);
    }
  }
  await encoder.flush();
  encoder.close();
  if (encError) throw encError;
  if (!packets.length) throw new Error("tidak ada paket Opus");

  // ---- bungkus ke Ogg ----
  const serial = (Math.random() * 0xffffffff) >>> 0;
  const out = [];
  let seq = 0;
  out.push(makePage([opusHead(nCh, preSkip)], { granule: 0, serial, seq: seq++, flags: 0x02 }));
  out.push(makePage([opusTags()], { granule: 0, serial, seq: seq++, flags: 0 }));

  const samplesPerPacket = FRAME; // paket 20 ms
  let granule = preSkip;
  let batch = [];
  let segCount = 0;
  const flush = (eos) => {
    if (!batch.length) return;
    out.push(makePage(batch, { granule, serial, seq: seq++, flags: eos ? 0x04 : 0 }));
    batch = [];
    segCount = 0;
  };
  packets.forEach((p, idx) => {
    const segs = Math.floor(p.length / 255) + 1;
    if (segCount + segs > 255 || batch.length >= 40) flush(false);
    batch.push(p);
    segCount += segs;
    granule = preSkip + Math.min((idx + 1) * samplesPerPacket, total);
    if (idx === packets.length - 1) flush(true);
  });
  onProgress?.(1);
  return { silent: false, chunks: out };
}
