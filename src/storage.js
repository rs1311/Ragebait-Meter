window.RBM_STORAGE = (() => {
  const DEFAULT_SETTINGS = {
    enabled: true,
    sensitivity: 1.0,
    triggers: { injustice: 1.0, hypocrisy: 1.0, identity: 1.0, doom: 1.0 },
    interventions: { blurHotParagraphs: false, cooldownOnHigh: false, cooldownSeconds: 8 },
    siteBaselines: {}
  };

  async function getSettings() {
    const { settings } = await chrome.storage.sync.get(["settings"]);
    return { ...DEFAULT_SETTINGS, ...(settings || {}) };
  }

  async function setSettings(next) {
    await chrome.storage.sync.set({ settings: next });
  }

  async function updateSiteBaseline(host, manipulationScore) {
    const s = await getSettings();
    const b = s.siteBaselines[host] || { mean: manipulationScore, samples: 0 };
    const samples = b.samples + 1;
    const mean = b.mean + (manipulationScore - b.mean) / samples;
    s.siteBaselines[host] = { mean, samples };
    await setSettings(s);
    return s.siteBaselines[host];
  }

  return { getSettings, setSettings, updateSiteBaseline };
})();
