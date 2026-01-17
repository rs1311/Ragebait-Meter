import { pipeline, env } from "./vendor/transformers.js";

// IMPORTANT for extensions:
// - allowLocalModels false (we fetch from HF)
// - single-thread WASM is more reliable in many extension contexts
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

// If you choose to bundle ort wasm files locally, point wasmPaths here.
// For runtime HF fetch only, this can remain default.
// Example if bundled:
// env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL("vendor/ort/");

let classifierPromise = null;

async function getClassifier(modelName) {
  if (!classifierPromise) {
    classifierPromise = pipeline("text-classification", modelName, {
      // returns top label unless you ask for all labels
      // we want full distribution:
      topk: null
    });
  }
  return classifierPromise;
}

// In-memory cache: hash -> result
const cache = new Map();

// Normalize outputs to a stable label->score map
function normalizeOutput(out) {
  // out can be [{label, score}, ...]
  const map = Object.create(null);
  for (const item of out) {
    map[item.label] = item.score;
  }
  return map;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (!msg || msg.target !== "rbm-offscreen") return;

    if (msg.type === "ping") {
      sendResponse({ ok: true });
      return;
    }

    if (msg.type === "infer_emotions") {
      const { model, items } = msg; // items: [{ id, text }]
      const clf = await getClassifier(model);

      const results = [];
      for (const it of items) {
        if (cache.has(it.id)) {
          results.push({ id: it.id, emotions: cache.get(it.id) });
          continue;
        }
        const out = await clf(it.text);
        const emotions = normalizeOutput(out);
        cache.set(it.id, emotions);
        results.push({ id: it.id, emotions });
      }

      sendResponse({ ok: true, results });
      return;
    }

    sendResponse({ ok: false, error: "unknown_message" });
  })().catch(err => {
    sendResponse({ ok: false, error: String(err?.message || err) });
  });

  // Keep channel open for async response
  return true;
});
