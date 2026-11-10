import { trimAndEncode } from "./mp3core.js";

self.onmessage = (e) => {
  const { channels, sampleRate } = e.data;
  try {
    const res = trimAndEncode(channels, sampleRate, (p) =>
      self.postMessage({ type: "progress", p })
    );
    self.postMessage(
      { type: "done", ...res },
      res.chunks ? res.chunks.map((c) => c.buffer) : []
    );
  } catch (err) {
    self.postMessage({ type: "error", message: String(err?.message || err) });
  }
};
