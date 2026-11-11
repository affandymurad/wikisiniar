import { trimAndEncode } from "./oggcore.js";

self.onmessage = async (e) => {
  const { channels, sampleRate } = e.data;
  try {
    const res = await trimAndEncode(channels, sampleRate, (p) =>
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
