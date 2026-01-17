// background.js (ML removed completely)

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  // Keep the channel alive for async consistency
  (async () => {
    if (!msg || msg.target !== "rbm-bg") {
      sendResponse({ ok: false, error: "wrong_target" });
      return;
    }

    // ML is removed. Content script should not request this anymore.
    if (msg.type === "infer_emotions") {
      sendResponse({ ok: false, error: "ml_removed" });
      return;
    }

    sendResponse({ ok: false, error: "unknown_message" });
  })().catch(err => {
    sendResponse({ ok: false, error: String(err?.message || err) });
  });

  return true;
});
