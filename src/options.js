// options.js (no imports; uses global RBM_STORAGE from storage.js)

const { getSettings, setSettings } = window.RBM_STORAGE;

const TRIGGERS = ["injustice", "hypocrisy", "identity", "doom"];

function sliderRow(key, value) {
  const d = document.createElement("div");
  d.className = "row";
  d.innerHTML = `
    <div>
      <div style="font-weight:700;">${key}</div>
      <div class="sub">0.5–2.0</div>
    </div>
    <div>
      <input id="t_${key}" type="range" min="0.5" max="2.0" step="0.1" value="${value}">
      <span id="v_${key}">${Number(value).toFixed(1)}</span>
    </div>
  `;
  return d;
}

(async () => {
  const s = await getSettings();

  const sens = document.getElementById("sensitivity");
  const sensVal = document.getElementById("sensitivityVal");
  sens.value = s.sensitivity ?? 1.0;
  sensVal.textContent = Number(sens.value).toFixed(1);

  sens.oninput = async () => {
    const n = await getSettings();
    n.sensitivity = Number(sens.value);
    sensVal.textContent = n.sensitivity.toFixed(1);
    await setSettings(n);
  };

  const trig = document.getElementById("triggers");
  trig.innerHTML = "";
  for (const k of TRIGGERS) trig.appendChild(sliderRow(k, (s.triggers && s.triggers[k]) ?? 1));

  for (const k of TRIGGERS) {
    document.getElementById(`t_${k}`).oninput = async (e) => {
      const n = await getSettings();
      n.triggers = n.triggers || {};
      n.triggers[k] = Number(e.target.value);
      document.getElementById(`v_${k}`).textContent = n.triggers[k].toFixed(1);
      await setSettings(n);
    };
  }

  // Interventions
  document.getElementById("blurHot").checked = !!(s.interventions && s.interventions.blurHotParagraphs);
  document.getElementById("cooldown").checked = !!(s.interventions && s.interventions.cooldownOnHigh);
  document.getElementById("cooldownSeconds").value = (s.interventions && s.interventions.cooldownSeconds) ?? 8;

  for (const id of ["blurHot", "cooldown", "cooldownSeconds"]) {
    const el = document.getElementById(id);
    if (!el) continue;

    el.onchange = async () => {
      const n = await getSettings();
      n.interventions = n.interventions || {};
      n.interventions.blurHotParagraphs = document.getElementById("blurHot").checked;
      n.interventions.cooldownOnHigh = document.getElementById("cooldown").checked;
      n.interventions.cooldownSeconds = Number(document.getElementById("cooldownSeconds").value || 0);
      await setSettings(n);
    };
  }

  // Baselines
  const baselines = document.getElementById("baselines");
  if (baselines) baselines.textContent = JSON.stringify(s.siteBaselines || {}, null, 2);

  const reset = document.getElementById("resetBaselines");
  if (reset) {
    reset.onclick = async () => {
      const n = await getSettings();
      n.siteBaselines = {};
      await setSettings(n);
      if (baselines) baselines.textContent = "{}";
    };
  }

  // Optional: if you kept maxP/maxC inputs but repurposed them (non-ML),
  // you can wire them here. Otherwise, remove those inputs from HTML.
})();
