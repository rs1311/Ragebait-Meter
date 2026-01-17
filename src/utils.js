window.RBM_UTILS = {
  clamp(x, a = 0, b = 100) {
    return Math.max(a, Math.min(b, x));
  },
  getHost() {
    try { return new URL(location.href).host.replace(/^www\./, ""); }
    catch { return "unknown"; }
  },
  hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }
};
