/* Pemangkasan hening di awal/akhir rekaman, hasil dikodekan ke MP3. */
import { Mp3Encoder } from "@breezystack/lamejs";

const THRESHOLD = 0.01; // amplitudo dianggap "ada suara"
const PRE_ROLL = 0.12; // detik disisakan sebelum suara pertama
const POST_ROLL = 0.35; // detik disisakan setelah suara terakhir
const KBPS = 128;
const BLOCK = 1152; // ukuran frame MP3

function toInt16(f32) {
  const out = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function encodeMp3(channels, sampleRate) {
  const nCh = channels.length;
  const enc = new Mp3Encoder(nCh, sampleRate, KBPS);
  const pcm = channels.map(toInt16);
  const chunks = [];
  for (let i = 0; i < pcm[0].length; i += BLOCK) {
    const buf =
      nCh === 2
        ? enc.encodeBuffer(pcm[0].subarray(i, i + BLOCK), pcm[1].subarray(i, i + BLOCK))
        : enc.encodeBuffer(pcm[0].subarray(i, i + BLOCK));
    if (buf.length) chunks.push(buf);
  }
  const tail = enc.flush();
  if (tail.length) chunks.push(tail);
  return new Blob(chunks, { type: "audio/mpeg" });
}

/**
 * @returns {Promise<{blob: Blob, silent: boolean}>}
 * Bila dekode/enkode gagal, blob asli dikembalikan apa adanya (silent=false).
 */
export async function trimSilence(blob) {
  let ctx;
  try {
    ctx = new AudioContext();
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    const nCh = Math.min(decoded.numberOfChannels, 2);
    const data = Array.from({ length: nCh }, (_, c) => decoded.getChannelData(c));
    const len = decoded.length;
    const sr = decoded.sampleRate;

    const loud = (i) => data.some((ch) => Math.abs(ch[i]) > THRESHOLD);
    let first = 0;
    while (first < len && !loud(first)) first++;
    if (first >= len) return { blob, silent: true };
    let last = len - 1;
    while (last > first && !loud(last)) last--;

    const start = Math.max(0, first - Math.round(PRE_ROLL * sr));
    const end = Math.min(len, last + Math.round(POST_ROLL * sr));
    return {
      blob: encodeMp3(data.map((ch) => ch.subarray(start, end)), sr),
      silent: false,
    };
  } catch {
    return { blob, silent: false };
  } finally {
    ctx?.close().catch(() => {});
  }
}
