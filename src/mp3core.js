/* Inti pemangkasan hening + enkode MP3. Murni sinkron; dijalankan di Web Worker. */
import { Mp3Encoder } from "@breezystack/lamejs";

const THRESHOLD = 0.01; // amplitudo dianggap "ada suara"
const PRE_ROLL = 0.12; // detik disisakan sebelum suara pertama
const POST_ROLL = 0.35; // detik disisakan setelah suara terakhir
const KBPS = 128;
const BLOCK = 1152; // ukuran frame MP3

function toInt16(f32, start, end) {
  const out = new Int16Array(end - start);
  for (let i = start; i < end; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]));
    out[i - start] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

/**
 * @param {Float32Array[]} data  1–2 kanal
 * @param {(fraction:number)=>void} onProgress
 * @returns {{silent:true} | {silent:false, chunks:Uint8Array[]}}
 */
export function trimAndEncode(data, sr, onProgress) {
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
  const enc = new Mp3Encoder(nCh, sr, KBPS);
  const pcm = data.map((ch) => toInt16(ch, start, end));
  const total = pcm[0].length;
  const chunks = [];
  let lastReport = -1;
  for (let i = 0; i < total; i += BLOCK) {
    const buf =
      nCh === 2
        ? enc.encodeBuffer(pcm[0].subarray(i, i + BLOCK), pcm[1].subarray(i, i + BLOCK))
        : enc.encodeBuffer(pcm[0].subarray(i, i + BLOCK));
    if (buf.length) chunks.push(buf.slice());
    const pct = Math.floor((i / total) * 100);
    if (pct !== lastReport) {
      lastReport = pct;
      onProgress?.(pct / 100);
    }
  }
  const tail = enc.flush();
  if (tail.length) chunks.push(tail.slice());
  onProgress?.(1);
  return { silent: false, chunks };
}
