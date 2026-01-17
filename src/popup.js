(async () => {
  const { getSettings, setSettings } = window.RBM_STORAGE;

  const settings = await getSettings();
  const enabled = document.getElementById("enabled");
  enabled.checked = settings.enabled;

  enabled.onchange = async () => {
    const s = await getSettings();
    s.enabled = enabled.checked;
    await setSettings(s);
  };

  document.getElementById("options").onclick = () => chrome.runtime.openOptionsPage();

  document.getElementById("rerun").onclick = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) chrome.tabs.reload(tab.id);
    window.close();
  };
})();
