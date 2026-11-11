/* Pemangkasan hening di awal/akhir rekaman, hasil dikodekan ke OGG (Opus).
   Pekerjaan berat berjalan di Web Worker agar halaman tidak membeku. */
import { trimAndEncode } from "./oggcore.js";

function runInWorker(channels, sampleRate, onProgress) {
  return new Promise((resolve, reject) => {
    let worker;
    try {
      worker = new Worker(new URL("./ogg.worker.js", import.meta.url), { type: "module" });
    } catch (err) {
      reject(err);
      return;
    }
    worker.onmessage = (e) => {
      const m = e.data;
      if (m.type === "progress") onProgress?.(m.p);
      else {
        worker.terminate();
        if (m.type === "done") resolve(m);
        else reject(new Error(m.message));
      }
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message || "worker error"));
    };
    worker.postMessage({ channels, sampleRate }, channels.map((c) => c.buffer));
  });
}

/**
 * @param {Blob} blob
 * @param {(fraction:number)=>void} [onProgress]  0..1, hanya untuk tahap enkode
 * @returns {Promise<{blob: Blob, silent: boolean}>}
 * Bila dekode/enkode gagal, blob asli dikembalikan apa adanya (silent=false).
 */
export async function trimSilence(blob, onProgress) {
  let ctx;
  try {
    ctx = new AudioContext({ sampleRate: 48000 }); // Opus bekerja di 48 kHz
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    const nCh = Math.min(decoded.numberOfChannels, 2);
    // Salin supaya buffernya bisa dipindahkan (transfer) ke worker.
    const data = Array.from({ length: nCh }, (_, c) => decoded.getChannelData(c).slice());
    const sr = decoded.sampleRate;

    let res;
    try {
      res = await runInWorker(data.map((d) => d), sr, onProgress);
    } catch {
      // Worker tak tersedia: jalan di thread utama (halaman bisa terasa berat).
      const copy = Array.from({ length: nCh }, (_, c) => decoded.getChannelData(c));
      res = await trimAndEncode(copy, sr, onProgress);
    }
    if (res.silent) return { blob, silent: true };
    return { blob: new Blob(res.chunks, { type: "audio/ogg" }), silent: false };
  } catch {
    return { blob, silent: false };
  } finally {
    ctx?.close().catch(() => {});
  }
}
