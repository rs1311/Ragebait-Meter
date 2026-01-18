
(() => {
  const { clamp, getHost, hashStr } = window.RBM_UTILS || {};
  const { getSettings, updateSiteBaseline } = window.RBM_STORAGE || {};
  const { LEX, normCount } = window.RBM_LEX || {};

  if (!clamp || !getHost || !hashStr || !getSettings || !updateSiteBaseline || !LEX || !normCount) {
    try {
      const el = document.createElement("div");
      el.id = "rbm-overlay";
      el.style.cssText = "position:fixed;top:14px;right:14px;z-index:2147483647;padding:10px 12px;border-radius:10px;background:rgba(10,10,14,0.92);color:#eef1f6;font:12px system-ui;";
      el.textContent = "Ragebait Meter: missing globals (check content_scripts order).";
      document.documentElement.appendChild(el);
    } catch {}
    return;
  }


  const RBM_EMO = (() => {
    const EMO = {
      anger: [
        "furious","rage","outrage","infuriating","enraged","seething","livid","angry","mad",
        "incensed","irate","outraged","fuming","apoplectic","wrathful","indignant","resentful",
        "aggravated","pissed","pissed off","lashing out","seeing red","boiling with anger",
        "blood boiling","fed up","sick of","had enough","ranting","raging","storming",
        "hate","loathe","despise"
      ],

      disgust: [
        "disgusting","revolting","sickening","gross","vile","repulsive","nauseating","filthy",
        "abhorrent","loathsome","foul","putrid","rank","fetid","nasty","repugnant","offensive",
        "detestable","depraved","sleazy","slimy","grimy","unclean","stinking","stench",
        "makes me sick","makes you sick","turns my stomach","turns your stomach",
        "queasy","nauseous","vomit","puke","retch","gag","gagging"
      ],

      fear: [
        "terrifying","scary","unsafe","fear","alarming","panic","risk",
        "frightening","horrifying","petrifying","spine-chilling","hair-raising",
        "dread","dreadful","dreading","anxious","anxiety","nervous","uneasy","apprehensive",
        "afraid","fearful","frightened","terrified","panic-stricken","paranoid",
        "ominous","foreboding","menacing","threatening","danger","dangerous","hazard",
        "life-threatening","deadly","lethal","violent","vulnerable","helpless",
        "nightmare","worst-case","catastrophe","catastrophic"
      ],

      sadness: [
        "tragic","heartbreaking","grief","sad","devastating","mourning","loss","despair",
        "sorrow","sorrowful","grieving","bereaved","bereavement","weep","weeping","cry","crying",
        "tears","tearful","brokenhearted","heartbroken","miserable","wretched","downcast",
        "melancholy","gloom","gloomy","hopeless","helpless","defeated","crushed","shattered",
        "depressed","depression","anguish","painful","hurt","hurting","lonely","isolated",
        "emptiness","empty","numb","numbness","regret","remorse"
      ],

      joy: [
        "amazing","wonderful","delight","happy","joy","great","excellent","love",
        "thrilled","ecstatic","overjoyed","elated","euphoric","jubilant","gleeful",
        "delighted","radiant","beaming","grinning","laughing","laughter","cheerful",
        "cheery","uplifting","hopeful","optimistic","relieved","relief",
        "grateful","gratitude","thankful","proud","pride","excited","stoked",
        "fantastic","brilliant","incredible","awesome","superb","marvelous"
      ]

    };

    const INTENS = ["very","extremely","incredibly","deeply","totally","absolutely","highly","insanely","so","too"];
    const NEG = ["not","never","no","without","hardly","rarely"];

    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const count = (t, arr) => {
      let c = 0;
      for (const w of arr) {
        const re = new RegExp("\\b" + esc(w) + "\\b", "gi");
        const m = t.match(re);
        if (m) c += m.length;
      }
      return c;
    };
    const squash = (x) => 1 - Math.exp(-x);

    function score(text) {
      const raw = text || "";
      const t = raw.toLowerCase();

      const words = t.match(/[a-z']+/g) || [];
      const wc = Math.max(1, words.length);

      const intens = count(t, INTENS);
      const neg = count(t, NEG);
      const exclaim = (raw.match(/!/g) || []).length;

      const amp = 1 + 0.18 * intens + 0.14 * exclaim;
      const negFactor = Math.max(0.70, 1 - 0.05 * neg);

      const norm = (hits) => squash((hits / (wc / 120)) * amp * negFactor);

      return {
        anger: norm(count(t, EMO.anger)),
        disgust: norm(count(t, EMO.disgust)),
        fear: norm(count(t, EMO.fear)),
        sadness: norm(count(t, EMO.sadness)),
        joy: norm(count(t, EMO.joy))
      };
    }
    return { score };
  })();

  function injectDrawerStyles() {
    if (document.getElementById("rbm-drawer-style")) return;
    const s = document.createElement("style");
    s.id = "rbm-drawer-style";
    s.textContent = `
      :root { --rbmW: 360px; --rbmTabW: 54px; }

      #rbm-overlay{
        position: fixed !important;
        top: 14px !important;
        right: 14px !important;
        z-index: 2147483647 !important;
        width: var(--rbmW) !important;
        transform: translateX(calc(var(--rbmW) - var(--rbmTabW))) !important;
        transition: transform 240ms cubic-bezier(.2,.9,.2,1), opacity 180ms ease !important;
        opacity: 0.985 !important;
        pointer-events: auto !important;
      }
      #rbm-overlay.rbm-open .rbm-title{
        font-size: 20px;        /* adjust as desired */
        font-weight: 800;
        letter-spacing: 0.02em;
      }
      #rbm-overlay.rbm-open{ transform: translateX(0) !important; }

      #rbm-overlay:not(.rbm-open){
        width: var(--rbmTabW) !important;
        transform: translateX(0) !important;
      }
      #rbm-overlay:not(.rbm-open) .rbm-sub,
      #rbm-overlay:not(.rbm-open) .rbm-body{ display:none !important; }

      #rbm-overlay:not(.rbm-open) .rbm-head{
        height: 240px;
        display:flex;
        flex-direction:column;
        justify-content:space-between;
        align-items:center;
        padding: 10px 6px !important;
        border-radius: 18px !important;
        background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04)) !important;
        box-shadow: 0 10px 30px rgba(0,0,0,0.30) !important;
      }
      #rbm-overlay:not(.rbm-open) .rbm-title{
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        letter-spacing: 0.08em;
        font-weight: 800;
        font-size: 12px;
        opacity: 0.95;
      }
      #rbm-overlay:not(.rbm-open) .rbm-actions{
        display:flex;
        flex-direction:column;
        gap: 8px;
      }
      #rbm-overlay:not(.rbm-open) .rbm-btn{
        width: 38px;
        height: 38px;
        border-radius: 12px;
      }
      #rbm-overlay:not(.rbm-open)::after{
        content:"";
        position:absolute;
        inset:-2px;
        border-radius: 20px;
        pointer-events:none;
        background: radial-gradient(80px 120px at 50% 25%, rgba(255,255,255,0.14), transparent 60%);
      }

      #rbm-overlay .rbm-body{
        max-height: calc(100vh - 88px) !important;
        overflow-y: auto !important;
        overscroll-behavior: contain !important;
        padding-right: 6px !important;
      }
      #rbm-overlay .rbm-body::-webkit-scrollbar{ width: 10px; }
      #rbm-overlay .rbm-body::-webkit-scrollbar-thumb{ background: rgba(255,255,255,0.14); border-radius: 999px; }
      #rbm-overlay .rbm-body::-webkit-scrollbar-track{ background: rgba(0,0,0,0.0); }

      #rbm-overlay .rbm-head{ cursor: pointer; user-select:none; }

      @keyframes rbmPulse {
        0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.00); outline: 0px solid rgba(255,255,255,0.0); background: rgba(255,255,255,0.0); }
        18%  { box-shadow: 0 0 0 8px rgba(255,255,255,0.12); outline: 3px solid rgba(255,255,255,0.35); background: rgba(255,255,255,0.10); }
        60%  { box-shadow: 0 0 0 14px rgba(255,255,255,0.08); outline: 2px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.06); }
        100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.0); outline: 0px solid rgba(255,255,255,0.0); background: rgba(255,255,255,0.0); }
      }
      .rbm-hotflash{
        animation: rbmPulse 950ms ease-out 1;
        border-radius: 10px;
      }
        .rbm-redpen-span{
          color: rgba(245, 78, 78, 0.98) !important;
          background: rgba(255,60,60,0.18);
          border-bottom: 2px solid rgba(255,60,60,0.85);
          border-radius: 4px;
          padding: 0 3px;
          font-weight: 600;
        }
        /* Quote under title (expanded only) */
        #rbm-overlay .rbm-quote{
          margin-top: 4px;
          font-size: 24px;
          font-weight: 900;
          letter-spacing: 0.02em;
          line-height: 1.25;
          color: rgba(238,241,246,0.85); /* default */
        }


        /* Hide quote in collapsed chip */
        #rbm-overlay:not(.rbm-open) .rbm-quote{
          display: none;
        }


      .rbm-redpen-note{
        margin-left: 4px;
        font-size: 10px;
        font-weight: 800;
        color: rgba(255,120,120,0.95);
        border: 1px solid rgba(255,120,120,0.35);
        border-radius: 999px;
        padding: 1px 6px;
        background: rgba(255,60,60,0.10);
        vertical-align: 1px;
        user-select: none;
      }
      .rbm-redpen-warn{
        color: rgba(255,60,60,0.98);
        font-weight: 900;
        margin-right: 2px;
      }
      #rbm-overlay .rbm-title-wrap{
        display:flex;
        align-items:center;
        gap:8px;
      }

      #rbm-overlay #rbm-icon{
        width:18px;
        height:18px;
        border-radius:4px;
        object-fit:contain;
        display:none;                 /* only show after load */
        filter: drop-shadow(0 0 4px rgba(255,255,255,0.25));
      }
      #rbm-overlay .rbm-volcano{
        font-size: 40px;
        line-height: 1;
        filter: drop-shadow(0 0 4px rgba(255,255,255,0.18));
        transform: translateY(-0.5px);
      }
        /* Tier colors */
        #rbm-overlay .rbm-tier-d{ color: rgba(255,255,255,0.92); }                 /* white */
        #rbm-overlay .rbm-tier-c{ color: #cd7f32; }                                /* bronze */
        #rbm-overlay .rbm-tier-b{ color: #c0c0c0; }                                /* silver */
        #rbm-overlay .rbm-tier-a{ color: #d4af37; }                                /* gold */
        #rbm-overlay .rbm-tier-f{ color: rgba(238,241,246,0.70); }                 /* muted */

        /* Multicolor tiers (text gradient) */
        #rbm-overlay .rbm-tier-s,
        #rbm-overlay .rbm-tier-splus,
        #rbm-overlay .rbm-tier-splusplus{
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 0 6px rgba(255,255,255,0.14));
          animation: rbmTierSheen 2.6s linear infinite;
        }

        #rbm-overlay .rbm-tier-s{
          background-image: linear-gradient(90deg, #ff4d4d, #ffcc00, #44ff88, #44a3ff, #b26bff, #ff4d4d);
        }

        #rbm-overlay .rbm-tier-splus{
          background-image: linear-gradient(90deg, #ff2d55, #ffcc00, #00ffa3, #3b82f6, #a855f7, #ff2d55);
        }

        #rbm-overlay .rbm-tier-splusplus{
          background-image: linear-gradient(90deg, #ffffff, #ffcc00, #00ffa3, #3b82f6, #a855f7, #ff2d55, #ffffff);
        }

        @keyframes rbmTierSheen{
          0%{ background-position: 0% 50%; }
          100%{ background-position: 200% 50%; }
        }





    `;
    document.documentElement.appendChild(s);
  }

  async function waitForContent(maxWaitMs = 6000) {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const article = document.querySelector("article") || document.body;
      const count = article.querySelectorAll("p,li,blockquote,h2,h3,div").length;
      if (count >= 8) return true;
      await new Promise(r => setTimeout(r, 250));
    }
    return false;
  }

  function extractParagraphs() {
    const root = document.querySelector("article") || document.body;

    const pick = (selector, minLen) => {
      const els = Array.from(root.querySelectorAll(selector));
      const out = [];
      for (const el of els) {
        const t = (el.textContent || "").replace(/\s+/g, " ").trim();
        if (t.length >= minLen) out.push({ el, text: t });
      }
      return out;
    };

    let pairs = pick("p,li,blockquote,h2,h3", 60);
    if (pairs.length < 3) {
      pairs = pick("div", 120).filter(x => x.text.length <= 1200).slice(0, 60);
    }

    const title = (document.querySelector("h1")?.textContent || document.title || "").trim();
    return { title, paragraphs: pairs.map(x => x.text), elements: pairs.map(x => x.el) };
  }
  function extractRedpenTargets() {
    const root = document.querySelector("article") || document.body;

    const els = Array.from(root.querySelectorAll("p,li,blockquote,h2,h3"));

    if (els.length < 10) {
      const divs = Array.from(root.querySelectorAll("div"))
        .filter(el => {
          const t = (el.textContent || "").replace(/\s+/g, " ").trim();
          if (t.length < 60 || t.length > 1600) return false;
          if (el.closest("#rbm-overlay")) return false;
          return true;
        });
      return divs.slice(0, 300);
    }

    return els
      .filter(el => !el.closest("#rbm-overlay"))
      .slice(0, 600); 
  }


  function scoreSeriousnessFromLex(text) {
    const harm = normCount(text, LEX.seriousness.harm);
    const money = normCount(text, LEX.seriousness.money);
    const rights = normCount(text, LEX.seriousness.rights);

    const words = Math.max(1, (text.toLowerCase().match(/[a-z']+/g) || []).length);
    const per1k = x => (x / words) * 1000;

    const density = 1.6 * per1k(harm) + 1.1 * per1k(money) + 1.1 * per1k(rights);
    const raw = 100 * (1 - Math.exp(-density / 6));


    const x = clamp(raw) / 100;
    const eps = 1e-6;
    const k = 0.65; 

    const z = Math.log((x + eps) / (1 - x + eps));     
    const y = 1 / (1 + Math.exp(-k * z));            

    return clamp(y * 100);
  }

  function buildTacticSignals(text, title) {
    const wordCount = Math.max(1, (text.toLowerCase().match(/[a-z']+/g) || []).length);

    const outrage = normCount(text, LEX.outrage);
    const urgency = normCount(text, LEX.urgency);
    const certainty = normCount(text, LEX.certainty);
    const generalizers = normCount(text, LEX.generalizers);
    const adHominem = normCount(text, LEX.adHominem);
    const dehumanize = normCount(text, LEX.dehumanize);
    const hedges = normCount(text, LEX.evidenceHedges);

    const exclaim = (text.match(/!/g) || []).length;
    const question = (text.match(/\?/g) || []).length;

    const titleBait = (normCount(title, LEX.outrage) + normCount(title, LEX.urgency)) * 10;
    const per1k = x => (x / wordCount) * 1000;

    const punctRagePer1k = ((exclaim * 1.0 + question * 0.6) / wordCount) * 1000;

    return {
      outragePer1k: per1k(outrage),
      urgencyPer1k: per1k(urgency),
      certaintyPer1k: per1k(certainty),
      generalizersPer1k: per1k(generalizers),
      adHominemPer1k: per1k(adHominem),
      dehumanizePer1k: per1k(dehumanize),
      hedgesPer1k: per1k(hedges),
      titleBait,
      punctRagePer1k,
      punct: { exclaim, question, wordCount }
    };
  }

  function mergeEmotionScore(em) {
    const anger = em.anger || 0;
    const disgust = em.disgust || 0;
    const fear = em.fear || 0;
    const sadness = em.sadness || 0;

    const outrage = anger + disgust;
    const threat = fear;
    const doom = fear + sadness;

    return { outrage, threat, doom };
  }

  function scoreCategories(text, title) {
    const CATS = window.RBM_CATS || {};
    const words = Math.max(1, (text.toLowerCase().match(/[a-z']+/g) || []).length);
    const per1k = (x) => (x / words) * 1000;

    const out = {};
    for (const [k, phrases] of Object.entries(CATS)) out[k] = per1k(normCount(text, phrases));

    out.HEADLINE = 0;
    if (title) {
      out.HEADLINE =
        3.0 * per1k(normCount(title, CATS.CLICKBAIT || [])) +
        2.0 * per1k(normCount(title, CATS.URGENCY || [])) +
        2.0 * per1k(normCount(title, CATS.MORAL_SHOCK || []));
    }
    return out;
  }

  function computeManipulation({ tactic, emoAgg, cats }, settings, baseline) {
    const w = {
      MORAL_SHOCK: 10, BETRAYAL: 8, SCAPEGOAT: 7, DEHUMANIZE: 18,
      URGENCY: 10, CERTAINTY: 8, CONSPIRACY: 12, EVIDENCE_VAGUE: 6,
      IDENTITY: 6, PURITY_TESTS: 10,
      FEAR_FRAME: 8, DOOM_FRAME: 9,
      WAR_LANGUAGE: 10, VIOLENCE_HINTS: 16,
      STRAWMAN: 6, LOADED_Q: 6, WHATABOUT: 6,
      CALL_TO_ANGER: 12, CLICKBAIT: 10, HEADLINE: 14
    };

    let raw = 0;

    raw += 34 * emoAgg.outrage + 18 * emoAgg.threat + 14 * emoAgg.doom;

    raw +=
      2.0 * tactic.outragePer1k +
      1.8 * tactic.urgencyPer1k +
      1.4 * tactic.certaintyPer1k +
      1.2 * tactic.generalizersPer1k +
      3.2 * tactic.adHominemPer1k +
      4.0 * tactic.dehumanizePer1k +
      1.0 * tactic.hedgesPer1k +
      1.6 * tactic.titleBait +
      1.6 * (tactic.punctRagePer1k || 0);

    for (const [k, v] of Object.entries(cats || {})) raw += (w[k] || 0) * v;

    const trigMult =
      1 +
      0.10 * ((settings.triggers?.injustice ?? 1) - 1) +
      0.08 * ((settings.triggers?.hypocrisy ?? 1) - 1) +
      0.10 * ((settings.triggers?.identity ?? 1) - 1) +
      0.08 * ((settings.triggers?.doom ?? 1) - 1);

    raw *= (settings.sensitivity ?? 1) * trigMult;

    raw = 100 * (1 - Math.exp(-raw / 55));

    if (baseline && baseline.samples >= 5) raw = raw - baseline.mean * 0.35;

    return clamp(raw);
  }

  function createOverlay() {
    if (document.getElementById("rbm-overlay")) return;

    injectDrawerStyles();

    const el = document.createElement("div");
    el.id = "rbm-overlay";
    el.classList.remove("rbm-open");

    el.innerHTML = `
      <div class="rbm-head" id="rbm-head">
        <span class="rbm-volcano" aria-hidden="true">🌋</span>
        <br />
        <div class="rbm-title">Ragebait Meter</div>
        <br />
        <div class="rbm-actions">
          <button class="rbm-btn" id="rbm-toggle" title="Expand/Collapse">⟷</button>
          <button class="rbm-btn" id="rbm-close" title="Close">×</button>
        </div>
      </div>


      <div class="rbm-sub" id="rbm-host"></div>

      <div class="rbm-body" id="rbm-body">
        <div class="rbm-grid2">
          <div class="rbm-metric">
            <div class="rbm-k">Manipulation</div>
            <div class="rbm-v" id="rbm-manip">—</div>
            <div class="rbm-bar"><div id="rbm-manip-bar"></div></div>
          </div>
          <div class="rbm-metric">
            <div class="rbm-k">Issue seriousness</div>
            <div class="rbm-v" id="rbm-ser">—</div>
            <div class="rbm-bar"><div id="rbm-ser-bar"></div></div>
          </div>
        </div>
        <div class="rbm-section">
          <div class="rbm-section-title">How bad is it?</div>
          <div class="rbm-quote" id="rbm-quote"></div>
        </div>
        <div class="rbm-section" id="rbm-catsec" style="display:none;">
          <div class="rbm-section-title">Sorry About The Ragebait, Hope Cats Cheer You Up!</div>
          <div id="rbm-catcount"
              style="font-size:18px;font-weight:900;letter-spacing:0.02em;line-height:1.25;color:rgba(238,241,246,0.85);">
            —
          </div>
        </div>

        <div class="rbm-section">
          <div class="rbm-section-title">Ragebait profile</div>
          <div id="rbm-radar"
               style="position:relative;border:1px solid rgba(255,255,255,0.10);border-radius:10px;padding:10px;overflow:hidden;">
          </div>
        </div>
        <div class="rbm-row">
          <button class="rbm-btn wide" id="rbm-toggle-blur">Toggle RageBlur 🔍</button>
          <button class="rbm-btn wide" id="rbm-toggle-redpen">Toggle RedPen ✍️</button>
        </div>

        <div class="rbm-section">
          <div class="rbm-section-title">Emotion summary</div>
          <div id="rbm-emo-bars"></div>
          <div style="margin-top:6px;font-size:11px;color:rgba(238,241,246,0.58);">
            Text = emotional words. Punct = !!! and ?? pressure.
          </div>
        </div>

        <div class="rbm-section">
          <div class="rbm-section-title">Hotspots</div>
          <div id="rbm-hotspots"></div>
        </div>

        <div class="rbm-section">
          <div class="rbm-section-title">Top signals</div>
          <div class="rbm-cards" id="rbm-cards"></div>
        </div>

         

        <div class="rbm-debug" id="rbm-debug" style="margin-top:10px;color:rgba(238,241,246,0.7);font-size:11px;"></div>
      </div>
    `;

    document.documentElement.appendChild(el);

    try {
      const icon = document.getElementById("rbm-icon");
      if (icon && chrome?.runtime?.getURL) {
        const path = "icon.png"; 
        const url = chrome.runtime.getURL(path);

        icon.style.display = "none";

        const show = () => { icon.style.display = "block"; };

        icon.onload = show;
        icon.onerror = async () => {
          try {
            const r = await fetch(url, { cache: "no-store" });
            if (!r.ok) throw new Error("fetch " + r.status);
            const b = await r.blob();
            const objUrl = URL.createObjectURL(b);
            icon.onload = () => { show(); URL.revokeObjectURL(objUrl); };
            icon.onerror = () => {};
            icon.src = objUrl;
          } catch (e) {
            try { setDebug(`icon failed: ${path}`); } catch {}
          }
        };

        icon.src = url;
      }
    } catch {}


    let rbmFxHasFiredThisOpen = false;

    const toggleDrawer = () => {
      const willOpen = !el.classList.contains("rbm-open");
      el.classList.toggle("rbm-open");
      if (!willOpen) return;

      rbmFxHasFiredThisOpen = false;

      const score = Number(el.dataset.rbmManipulation || 0);
      const tier = (ragebaitTier(score)?.tier || "F");

      // prevent stacking / duplicates
      RBM_EDGE_CATS.stop();

      const rate = volcanoRateForTier(tier);
      if (rate <= 0 || rbmFxHasFiredThisOpen) return;

      rbmFxHasFiredThisOpen = true;

      RBM_VOLCANO_RAIN.fireOnce(3000, rate, () => {
        if (tier === "S" || tier === "S+" || tier === "S++") {
          RBM_EDGE_CATS.start();
        }
      });
    };




    el.querySelector("#rbm-toggle").onclick = (e) => {
      e.stopPropagation();
      toggleDrawer();
    };
    el.querySelector("#rbm-head").onclick = () => toggleDrawer();
    el.querySelector("#rbm-close").onclick = (e) => {
      e.stopPropagation();
      el.remove();
    };
  }

  function setBar(id, value) {
    const el = document.getElementById(id);
    if (el) el.style.width = `${Math.round(value)}%`;
  }

  function radarPoints(cx, cy, r, n, values01) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (-Math.PI / 2) + (i * 2 * Math.PI / n);
      const v = Math.max(0, Math.min(1, values01[i] ?? 0));
      pts.push({ x: cx + Math.cos(a) * r * v, y: cy + Math.sin(a) * r * v });
    }
    return pts;
  }

  function polyStr(pts) {
    return pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  }
  function boostDisplayOnly(v0to100, p = 2.2) {
    const x = clamp(v0to100) / 100;
    const y = 1 - Math.pow(1 - x, p);
    return clamp(y * 100);
  }

  function radialScale01(x01, p = 2.4) {
    const x = Math.max(0, Math.min(1, x01));
    return 1 - Math.pow(1 - x, p);
  }

  function renderRadarProfile(vals /* plot 0..100 */, labels, displayVals /* optional 0..100 */) {
    const root = document.getElementById("rbm-radar");
    if (!root) return;
    root.innerHTML = "";

    const rect = root.getBoundingClientRect();
    const W = Math.min(320, Math.max(240, rect.width || 320));
    const H = 210;
    const pad = 16;
    const cx = W / 2;
    const cy = 100;
    const R = Math.min(80, (Math.min(W, H) / 2) - pad) * 1;

    const v01 = (vals || []).map(v => clamp(v) / 100);
    const n = labels.length;
    const shown = (displayVals && displayVals.length === n)
      ? displayVals.map(v => clamp(v))
      : (vals || []).map(v => clamp(v));



    const pScale = 9; 
    const vScaled01 = v01.map(v => radialScale01(v, pScale));

    const rings = [0.5, 1.0];
    const maxRing = Math.max(...rings);

    const axisPts = radarPoints(cx, cy, R * maxRing, n, Array(n).fill(1));
    const polyPts = radarPoints(cx, cy, R, n, vScaled01);
    const dotPts  = polyPts; 


    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", String(W));
    svg.setAttribute("height", String(H));
    svg.style.display = "block";
    svg.style.margin = "0 auto";

    const bg = document.createElementNS(svg.namespaceURI, "rect");
    bg.setAttribute("x", "0");
    bg.setAttribute("y", "0");
    bg.setAttribute("width", String(W));
    bg.setAttribute("height", String(H));
    bg.setAttribute("rx", "10");
    bg.setAttribute("fill", "rgba(255,255,255,0.03)");
    svg.appendChild(bg);

    for (const rr of rings) {
      const ringPts = radarPoints(cx, cy, R, n, Array(n).fill(rr));
      const pg = document.createElementNS(svg.namespaceURI, "polygon");
      pg.setAttribute("points", polyStr(ringPts));
      pg.setAttribute("fill", "none");
      pg.setAttribute("stroke", "rgba(255,255,255,0.10)");
      pg.setAttribute("stroke-width", "1");
      svg.appendChild(pg);
    }

    for (let i = 0; i < n; i++) {
      const ln = document.createElementNS(svg.namespaceURI, "line");
      ln.setAttribute("x1", String(cx));
      ln.setAttribute("y1", String(cy));
      ln.setAttribute("x2", String(axisPts[i].x));
      ln.setAttribute("y2", String(axisPts[i].y));
      ln.setAttribute("stroke", "rgba(255,255,255,0.10)");
      ln.setAttribute("stroke-width", "1");
      svg.appendChild(ln);
    }

    const poly = document.createElementNS(svg.namespaceURI, "polygon");
    poly.setAttribute("points", polyStr(polyPts));
    poly.setAttribute("fill", "rgba(255,255,255,0.14)");
    poly.setAttribute("stroke", "rgba(255,255,255,0.72)");
    poly.setAttribute("stroke-width", "1.5");
    svg.appendChild(poly);

    for (let i = 0; i < n; i++) {
      const c = document.createElementNS(svg.namespaceURI, "circle");
      c.setAttribute("cx", String(dotPts[i].x));
      c.setAttribute("cy", String(dotPts[i].y));
      c.setAttribute("r", "3.6");
      c.setAttribute("fill", "rgba(255,255,255,0.92)");
      svg.appendChild(c);
    }


    for (let i = 0; i < n; i++) {
      const p = axisPts[i];
      const dx = p.x - cx;
      const dy = p.y - cy;
      const len = Math.max(1e-6, Math.sqrt(dx*dx + dy*dy));
      const ux = dx / len, uy = dy / len;

      const tx = p.x + ux * 12;
      const ty = p.y + uy * 12;

      const t = document.createElementNS(svg.namespaceURI, "text");
      t.setAttribute("x", String(tx));
      t.setAttribute("y", String(ty));
      t.setAttribute("fill", "rgba(238,241,246,0.78)");
      t.setAttribute("font-size", "10");
      t.setAttribute("font-weight", "700");
      t.setAttribute("dominant-baseline", "middle");
      if (Math.abs(ux) < 0.2) t.setAttribute("text-anchor", "middle");
      else t.setAttribute("text-anchor", ux > 0 ? "start" : "end");
      t.textContent = labels[i];
      svg.appendChild(t);
    }

    const legend = document.createElement("div");
    legend.style.display = "grid";
    legend.style.gridTemplateColumns = "1fr 1fr";
    legend.style.gap = "6px 10px";
    legend.style.marginTop = "8px";
    legend.style.fontSize = "11px";
    legend.style.color = "rgba(238,241,246,0.72)";

    for (let i = 0; i < n; i++) {
      const item = document.createElement("div");
      item.style.display = "flex";
      item.style.justifyContent = "space-between";
      item.style.gap = "10px";
      item.innerHTML = `<span>${labels[i]}</span><span style="font-weight:800;">${Math.round(shown[i])}</span>`;
      legend.appendChild(item);
    }

    root.appendChild(svg);
    root.appendChild(legend);
  }


  function punctuationPressure01(punct) {
    const wc = Math.max(1, punct?.wordCount || 1);
    const per1k = (x) => (x / wc) * 1000;

    const raw =
      2.2 * per1k(punct?.exclaim || 0) +
      1.4 * per1k(punct?.question || 0);

    return clamp(100 * (1 - Math.exp(-raw / 18))) / 100;
  }


  function renderEmotionSummary(emoAgg, punct01) {
    const root = document.getElementById("rbm-emo-bars");
    if (!root) return;
    root.innerHTML = "";


    const emotions = [
      { key: "Angry",     v: emoAgg.outrage / 2 },
      { key: "Disgusted", v: emoAgg.outrage / 2 },
      { key: "Scared",    v: emoAgg.threat },
      { key: "Sad",       v: Math.max(0, emoAgg.doom - emoAgg.threat) },
      { key: "Happy",     v: 0 }, 
      { key: "Excited",   v: 0 }  
    ];


    try {
      const text = document.body.innerText || "";
      const joy = RBM_EMO.score(text).joy || 0;

      const excited = Math.min(1, joy + 0.6 * punct01);

      emotions.find(e => e.key === "Happy").v = joy;
      emotions.find(e => e.key === "Excited").v = excited;
    } catch {}


    const rows = emotions.map(e => ({
      label: e.key,
      value: clamp(e.v * 100)
    }));

    for (const r of rows) {
      const row = document.createElement("div");
      row.style.display = "grid";
      row.style.gridTemplateColumns = "90px 1fr 38px";
      row.style.gap = "8px";
      row.style.alignItems = "center";
      row.style.margin = "8px 0";

      row.innerHTML = `
        <div style="font-size:12px;font-weight:600;color:rgba(238,241,246,0.9);">
          ${r.label}
        </div>
        <div style="height:10px;border-radius:999px;background:rgba(255,255,255,0.10);overflow:hidden;">
          <div style="
            height:100%;
            width:${Math.round(r.value)}%;
            background:rgba(255,255,255,0.85);
          "></div>
        </div>
        <div style="text-align:right;font-size:12px;color:rgba(238,241,246,0.75);">
          ${Math.round(r.value)}
        </div>
      `;

      root.appendChild(row);
    }
  }

  function highlightElement(el) {
    if (!el) return;
    el.classList.remove("rbm-hotflash");
    void el.offsetWidth;
    el.classList.add("rbm-hotflash");
    setTimeout(() => el.classList.remove("rbm-hotflash"), 1100);
  }

  function hotspotScore(t) {
    const o = t?.outrage || 0;
    const th = t?.threat || 0;
    const d = t?.doom || 0;
    return clamp((o + 0.6 * th + 0.6 * d) * 100);
  }

  function renderHotspots(triples, selectedEls) {
    const root = document.getElementById("rbm-hotspots");
    if (!root) return;
    root.innerHTML = "";

    if (!triples || triples.length === 0) {
      root.innerHTML = `<div style="font-size:12px;color:rgba(238,241,246,0.65);">No hotspots found.</div>`;
      return;
    }

    const scored = triples.map((t, i) => ({ i, score: hotspotScore(t) }));
    scored.sort((a, b) => b.score - a.score);

    const top = scored.slice(0, Math.min(3, scored.length));

    for (const h of top) {
      const btn = document.createElement("button");
      btn.className = "rbm-btn wide";
      btn.style.display = "flex";
      btn.style.justifyContent = "space-between";
      btn.style.gap = "10px";
      btn.style.alignItems = "center";
      btn.style.padding = "8px 10px";
      btn.style.margin = "6px 0";
      btn.style.width = "100%";

      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.flexDirection = "column";
      left.style.alignItems = "flex-start";
      left.innerHTML = `
        <div style="font-weight:700;">Hotspot #${h.i + 1}</div>
        <div style="font-size:11px;color:rgba(238,241,246,0.65);">Intensity ${Math.round(h.score)}</div>
      `;

      const right = document.createElement("div");
      right.style.fontWeight = "850";
      right.textContent = `${Math.round(h.score)}`;

      btn.appendChild(left);
      btn.appendChild(right);

      btn.onclick = () => {
        const el = selectedEls?.[h.i];
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => highlightElement(el), 250);
      };

      root.appendChild(btn);
    }
  }

  function renderSignals(tactic, emoAgg, cats) {
    const cards = document.getElementById("rbm-cards");
    if (!cards) return;
    cards.innerHTML = "";

    const CAT_LABELS = {
      MORAL_SHOCK: "Moral Shock",
      FEAR_FRAME: "Fear Framing",
      DOOM_FRAME: "Catastrophic Framing",
      URGENCY: "Manufactured Urgency",
      CERTAINTY: "False Certainty",
      EVIDENCE_VAGUE: "Vague Evidence",
      CONSPIRACY: "Conspiracy Framing",
      IDENTITY: "Identity Triggering",
      PURITY_TESTS: "Purity Tests",
      SCAPEGOAT: "Scapegoating",
      DEHUMANIZE: "Dehumanizing Terms",
      CALL_TO_ANGER: "Anger Prompting",
      CLICKBAIT: "Clickbait",
      HEADLINE: "Headline Bait",
      STRAWMAN: "Strawman",
      LOADED_Q: "Loaded Questions",
      WHATABOUT: "Whataboutism",
      WAR_LANGUAGE: "War Language",
      VIOLENCE_HINTS: "Violence Hints",
      BETRAYAL: "Betrayal Framing"
    };

    const items = [
      { label: "Emotional Language", v: clamp((emoAgg?.outrage || 0) * 100) },
      { label: "Fear Framing",       v: clamp((emoAgg?.threat  || 0) * 100) },
      { label: "Catastrophic Framing", v: clamp((emoAgg?.doom  || 0) * 100) },
      { label: "Manufactured Urgency", v: clamp((tactic?.urgencyPer1k || 0) * 12) },

      { label: "Sweeping Generalizations", v: clamp((tactic?.generalizersPer1k || 0) * 12) },
      { label: "Personal Attacks",         v: clamp((tactic?.adHominemPer1k || 0) * 18) },
      { label: "Dehumanizing Terms",       v: clamp((tactic?.dehumanizePer1k || 0) * 22) },
      { label: "Punctuation Pressure",     v: clamp((tactic?.punctRagePer1k || 0) * 12) }
    ];


    if (cats) {
      for (const [k, v] of Object.entries(cats)) {
        if (!Number.isFinite(v)) continue;
        items.push({
          label: CAT_LABELS[k] ? CAT_LABELS[k] : `Signal: ${k}`,
          v: clamp(v * 12)
        });
      }
    }

    items.sort((a, b) => b.v - a.v);


    const top = items.slice(0, 4);

    for (const it of top) {
      const c = document.createElement("div");
      c.className = "rbm-card";
      c.innerHTML = `
        <div class="rbm-card-top">
          <div class="rbm-card-title">${it.label}</div>
          <div class="rbm-card-score">${Math.round(it.v)}</div>
        </div>
        <div class="rbm-bar small"><div style="width:${Math.round(it.v)}%"></div></div>
      `;
      cards.appendChild(c);
    }
  }


  function blurHotElements(toggleOn, hotIdxSet, selectedEls) {
    for (let idx = 0; idx < (selectedEls?.length || 0); idx++) {
      if (!hotIdxSet.has(idx)) continue;
      const el = selectedEls[idx];
      if (el) el.classList.toggle("rbm-blur", toggleOn);
    }
  }

  function scalePer1kTo100(x, k) {
    return clamp(100 * (1 - Math.exp(-(Math.max(0, x) / Math.max(1e-6, k)))));
  }
  function setCatCountUI(n) {
  try {
    const sec = document.getElementById("rbm-catsec");
    const el = document.getElementById("rbm-catcount");
    if (!sec || !el) return;
    el.textContent = `${Number(n) || 0} cats deployed`;
  } catch {}
}


  function setDebug(msg) {
    try {
      const dbg = document.getElementById("rbm-debug");
      if (dbg) dbg.textContent = msg;
    } catch {}
  }
  const SUBTOPIC_LABELS = {
    MORAL_SHOCK: "Moral shock",
    BETRAYAL: "Betrayal framing",
    CALL_TO_ANGER: "Call-to-anger",
    FEAR_FRAME: "Fear framing",
    WAR_LANGUAGE: "War language",
    VIOLENCE_HINTS: "Violence hints",
    DOOM_FRAME: "Catastrophe framing",
    URGENCY: "Manufactured urgency",
    CERTAINTY: "False certainty",
    EVIDENCE_VAGUE: "Vague evidence",
    CONSPIRACY: "Conspiracy implication",
    STRAWMAN: "Strawman",
    LOADED_Q: "Loaded questions",
    WHATABOUT: "Whataboutism",
    CLICKBAIT: "Headline bait",
    DEHUMANIZE: "Dehumanization",
    AD_HOMINEM: "Personal attacks",
    SCAPEGOAT: "Scapegoating",
    IDENTITY: "Identity triggering",
    PURITY_TESTS: "Purity tests",
    GENERALIZERS: "Sweeping generalizations",
    PUNCT_PRESSURE: "Punctuation pressure"
  };

  const AXIS_KEYS = ["OUTRAGE", "THREAT", "DOOM", "URGENCY", "DEHUMANIZE", "NARRATIVE"];
  const AXIS_LABELS = ["Outrage", "Threat", "Doom", "Urgency", "Dehumanize", "Narrative"];

  const SUBTOPIC_TO_AXIS = {

    MORAL_SHOCK: "OUTRAGE",
    BETRAYAL: "OUTRAGE",
    CALL_TO_ANGER: "OUTRAGE",


    FEAR_FRAME: "THREAT",
    WAR_LANGUAGE: "THREAT",
    VIOLENCE_HINTS: "THREAT",


    DOOM_FRAME: "DOOM",


    URGENCY: "URGENCY",
    PUNCT_PRESSURE: "URGENCY",


    DEHUMANIZE: "DEHUMANIZE",
    AD_HOMINEM: "DEHUMANIZE",
    SCAPEGOAT: "DEHUMANIZE",
    IDENTITY: "DEHUMANIZE",
    PURITY_TESTS: "DEHUMANIZE",


    CERTAINTY: "NARRATIVE",
    EVIDENCE_VAGUE: "NARRATIVE",
    CONSPIRACY: "NARRATIVE",
    STRAWMAN: "NARRATIVE",
    LOADED_Q: "NARRATIVE",
    WHATABOUT: "NARRATIVE",
    CLICKBAIT: "NARRATIVE",
    GENERALIZERS: "NARRATIVE"
  };

  function catPer1kTo100(per1k, k = 5.0) {
    return clamp(100 * (1 - Math.exp(-(Math.max(0, per1k) / Math.max(1e-6, k)))));
  }

  function computeSubtopics0to100({ tactic, cats, emoAgg, punct01 }) {
    const getCat = (k) => (cats && Number.isFinite(cats[k])) ? cats[k] : 0;


    const out = [];


    out.push({ key: "MORAL_SHOCK", v: catPer1kTo100(getCat("MORAL_SHOCK"), 4.0) });
    out.push({ key: "BETRAYAL", v: catPer1kTo100(getCat("BETRAYAL"), 4.5) });
    out.push({ key: "CALL_TO_ANGER", v: catPer1kTo100(getCat("CALL_TO_ANGER"), 4.5) });


    out.push({ key: "FEAR_FRAME", v: catPer1kTo100(getCat("FEAR_FRAME"), 4.5) });
    out.push({ key: "WAR_LANGUAGE", v: catPer1kTo100(getCat("WAR_LANGUAGE"), 4.5) });
    out.push({ key: "VIOLENCE_HINTS", v: catPer1kTo100(getCat("VIOLENCE_HINTS"), 2.8) });


    out.push({ key: "DOOM_FRAME", v: catPer1kTo100(getCat("DOOM_FRAME"), 4.0) });


    out.push({ key: "URGENCY", v: catPer1kTo100(getCat("URGENCY"), 3.8) });
    out.push({ key: "PUNCT_PRESSURE", v: clamp(punct01 * 100) });

    out.push({ key: "DEHUMANIZE", v: catPer1kTo100(getCat("DEHUMANIZE"), 2.0) });
    out.push({ key: "AD_HOMINEM", v: catPer1kTo100(getCat("AD_HOMINEM"), 3.2) });
    out.push({ key: "SCAPEGOAT", v: catPer1kTo100(getCat("SCAPEGOAT"), 4.5) });
    out.push({ key: "IDENTITY", v: catPer1kTo100(getCat("IDENTITY"), 5.0) });
    out.push({ key: "PURITY_TESTS", v: catPer1kTo100(getCat("PURITY_TESTS"), 4.8) });


    out.push({ key: "CERTAINTY", v: catPer1kTo100(getCat("CERTAINTY"), 4.0) });
    out.push({ key: "EVIDENCE_VAGUE", v: catPer1kTo100(getCat("EVIDENCE_VAGUE"), 4.5) });
    out.push({ key: "CONSPIRACY", v: catPer1kTo100(getCat("CONSPIRACY"), 3.5) });
    out.push({ key: "STRAWMAN", v: catPer1kTo100(getCat("STRAWMAN"), 4.5) });
    out.push({ key: "LOADED_Q", v: catPer1kTo100(getCat("LOADED_Q"), 4.5) });
    out.push({ key: "WHATABOUT", v: catPer1kTo100(getCat("WHATABOUT"), 4.5) });
    out.push({ key: "CLICKBAIT", v: catPer1kTo100(getCat("CLICKBAIT"), 4.5) });
    out.push({ key: "GENERALIZERS", v: clamp((tactic?.generalizersPer1k || 0) * 12) });

    return out
      .filter(x => x && x.key)
      .map(x => ({
        key: x.key,
        label: SUBTOPIC_LABELS[x.key] || x.key,
        axis: SUBTOPIC_TO_AXIS[x.key] || "NARRATIVE",
        v: clamp(x.v)
      }));
  }

  function aggregateAxes0to100(subtopics, emoAgg, tactic, cats) {
    const sum = { OUTRAGE: 0, THREAT: 0, DOOM: 0, URGENCY: 0, DEHUMANIZE: 0, NARRATIVE: 0 };
    const n   = { OUTRAGE: 0, THREAT: 0, DOOM: 0, URGENCY: 0, DEHUMANIZE: 0, NARRATIVE: 0 };

    for (const s of (subtopics || [])) {
      sum[s.axis] += s.v;
      n[s.axis] += 1;
    }

    const avg = (k) => n[k] ? (sum[k] / n[k]) : 0;

    let outrage = avg("OUTRAGE");
    let threat  = avg("THREAT");
    let doom    = avg("DOOM");
    let urgency = avg("URGENCY");
    let dehum   = avg("DEHUMANIZE");
    let narr    = avg("NARRATIVE");

    outrage = clamp(Math.max(outrage, (emoAgg?.outrage || 0) * 100));
    threat  = clamp(Math.max(threat,  (emoAgg?.threat  || 0) * 100));
    doom    = clamp(Math.max(doom,    (emoAgg?.doom    || 0) * 100));

    const headline = clamp(scalePer1kTo100((cats?.HEADLINE || 0), 6.0));
    narr = clamp(Math.max(narr, headline, scalePer1kTo100((tactic?.certaintyPer1k || 0), 4.5)));

    return [
      outrage, threat, doom, urgency, dehum, narr
    ];
  }

  function renderSubtopicSummary(subtopics) {
    const root = document.getElementById("rbm-emo-bars");
    if (!root) return;


    const old = document.getElementById("rbm-subtopics");
    if (old) old.remove();

    const wrap = document.createElement("div");
    wrap.id = "rbm-subtopics";
    wrap.style.marginTop = "10px";
    wrap.style.paddingTop = "8px";
    wrap.style.borderTop = "1px solid rgba(255,255,255,0.10)";

    const threshold = 18; 
    const kept = (subtopics || []).filter(s => s.v >= threshold);
    kept.sort((a,b) => b.v - a.v);


    const byAxis = {};
    for (const s of kept) {
      (byAxis[s.axis] ||= []).push(s);
    }

    if (kept.length === 0) {
      const top3 = (subtopics || []).slice().sort((a,b)=>b.v-a.v).slice(0,3);
      for (const s of top3) (byAxis[s.axis] ||= []).push(s);
    }

    for (let i = 0; i < AXIS_KEYS.length; i++) {
      const k = AXIS_KEYS[i];
      const label = AXIS_LABELS[i];
      const arr = byAxis[k];
      if (!arr || arr.length === 0) continue;

      const section = document.createElement("div");
      section.style.margin = "8px 0";

      const title = document.createElement("div");
      title.textContent = label;
      title.style.fontSize = "12px";
      title.style.fontWeight = "800";
      title.style.color = "rgba(238,241,246,0.86)";
      section.appendChild(title);

      const list = document.createElement("div");
      list.style.display = "flex";
      list.style.flexWrap = "wrap";
      list.style.gap = "6px";
      list.style.marginTop = "6px";

      const chips = arr.slice(0, 4);
      for (const s of chips) {
        const chip = document.createElement("div");
        chip.textContent = `${s.label} ${Math.round(s.v)}`;
        chip.style.fontSize = "11px";
        chip.style.padding = "4px 8px";
        chip.style.border = "1px solid rgba(255,255,255,0.10)";
        chip.style.borderRadius = "999px";
        chip.style.color = "rgba(238,241,246,0.75)";
        chip.style.background = "rgba(255,255,255,0.04)";
        list.appendChild(chip);
      }

      section.appendChild(list);
      wrap.appendChild(section);
    }

    root.appendChild(wrap);
  }
  const STOP_PHRASES = new Set([
    "very","extremely","incredibly","deeply","totally","absolutely","highly","insanely","so","too",
    "really","super","literally","just","quite","rather",

    "and","or","but","because","however","therefore","thus","then","now","also","actually",
    "basically","simply","clearly" 
  ]);

   const RBM_REDPEN = (() => {
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


    function phrasesToRegexes(arr) {
      const out = [];
      for (const p of (arr || [])) {
        const raw = String(p || "").trim();
        if (!raw) continue;

        const key = raw.toLowerCase();


        if (STOP_PHRASES.has(key)) continue;

        if (!raw.includes(" ") && raw.length < 4) continue;

        const isPhrase = raw.includes(" ");
        const pat = isPhrase
          ? raw.split(/\s+/).map(esc).join("\\s+")
          : "\\b" + esc(raw) + "\\b";

        out.push(new RegExp(pat, "gi"));
      }
      return out;
    }



    function buildLabelSets() {
      const CATS = window.RBM_CATS || {};
      return [

        { label: "Violence hint",     src: (CATS.VIOLENCE_HINTS || []) },
        { label: "Dehumanizing",      src: (LEX.dehumanize || []) },
        { label: "Scapegoating",      src: (CATS.SCAPEGOAT || []) },
        { label: "Conspiracy",        src: (CATS.CONSPIRACY || []) },


        { label: "Moral shock",       src: (CATS.MORAL_SHOCK || []) },
        { label: "Betrayal framing",  src: (CATS.BETRAYAL || []) },
        { label: "Fear framing",      src: (CATS.FEAR_FRAME || []) },
        { label: "Doom framing",      src: (CATS.DOOM_FRAME || []) },


        { label: "Vague evidence",    src: (CATS.EVIDENCE_VAGUE || []).concat(LEX.evidenceHedges || []) },
        { label: "False certainty",   src: (CATS.CERTAINTY || []).concat(LEX.certainty || []) },
        { label: "Generalizing",      src: (CATS.GENERALIZERS || []).concat(LEX.generalizers || []) },
        { label: "Personal attack",   src: (LEX.adHominem || []) },
        { label: "War language",      src: (CATS.WAR_LANGUAGE || []) },
        { label: "Urgency",           src: (CATS.URGENCY || []).concat(LEX.urgency || []) },


        { label: "Headline bait",     src: (CATS.CLICKBAIT || []) },
      ].map(s => ({ ...s, re: phrasesToRegexes(s.src) }));
    }

    function collectMatches(text, sets, maxMatches = 80) {
      const matches = [];
      for (let si = 0; si < sets.length; si++) {
        const set = sets[si];
        for (const re of set.re) {
          let m;
          while ((m = re.exec(text)) && matches.length < 800) {
            const hit = m[0] || "";
            const hitKey = hit.trim().toLowerCase();

            if (STOP_PHRASES.has(hitKey)) {
              if (m.index === re.lastIndex) re.lastIndex++;
              continue;
            }

            matches.push({
              start: m.index,
              end: m.index + hit.length,
              label: set.label,
              hit,
              rank: si 
            });

            if (m.index === re.lastIndex) re.lastIndex++;
          }
          re.lastIndex = 0;
        }
      }

      matches.sort((a, b) =>
        (a.start - b.start) ||
        ((b.end - b.start) - (a.end - a.start)) ||
        (a.rank - b.rank)
      );

      const wordSpans = [];
      const wordRe = /[A-Za-z']+/g;
      let wm;
      while ((wm = wordRe.exec(text))) {
        wordSpans.push({ start: wm.index, end: wm.index + wm[0].length });
      }

      if (wordSpans.length === 0) return matches.slice(0, maxMatches);

      function findFirstWordIdx(a, b) {
        for (let i = 0; i < wordSpans.length; i++) {
          const w = wordSpans[i];
          if (w.end > a && w.start < b) return i;
        }
        return -1;
      }
      function findLastWordIdx(a, b) {
        for (let i = wordSpans.length - 1; i >= 0; i--) {
          const w = wordSpans[i];
          if (w.end > a && w.start < b) return i;
        }
        return -1;
      }

      const N = 2;
      const expanded = matches.map(m => {
        const fi = findFirstWordIdx(m.start, m.end);
        const li = findLastWordIdx(m.start, m.end);

        if (fi < 0 || li < 0) return m;

        const f2 = Math.max(0, fi - N);
        const l2 = Math.min(wordSpans.length - 1, li + N);

        let start = wordSpans[f2].start;
        let end   = wordSpans[l2].end;

        const dot = text.indexOf(".", start);
        if (dot !== -1 && dot < end) {
          end = Math.max(m.end, dot + 1);
        }

        return { ...m, start, end };
      });


      expanded.sort((a, b) => (a.start - b.start) || (a.rank - b.rank));

      const merged = [];
      for (const m of expanded) {
        const labels = [m.label];
        const hits = [m.hit];

        if (merged.length === 0) {
          merged.push({ ...m, labels, hits });
          continue;
        }

        const last = merged[merged.length - 1];


        if (m.start <= last.end) {
          last.end = Math.max(last.end, m.end);


          if (m.rank < last.rank) last.rank = m.rank;


          last.labels.push(...labels);
          last.hits.push(...hits);
        } else {
          merged.push({ ...m, labels, hits });
        }

        if (merged.length >= maxMatches) break;
      }


      for (const s of merged) {
        const seen = new Set();
        s.labels = (s.labels || []).filter(x => {
          const k = String(x || "");
          if (!k || seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      }

      return merged;

    }

    function applyToElement(el, sets, mode = "strike") {
      if (!el) return 0;

      if (!el.dataset.rbmRedpenOrig) {
        el.dataset.rbmRedpenOrig = el.innerHTML;
      }

      if (el.querySelector?.(".rbm-redpen-span, .rbm-redpen-note")) {
        el.innerHTML = el.dataset.rbmRedpenOrig;
      }

      const text = (el.textContent || "");
      if (!text || text.length < 12) return 0;

      const ms = collectMatches(text, sets,400);
      if (ms.length === 0) return 0;

      const frag = document.createDocumentFragment();
      let cursor = 0;

      for (const m of ms) {
        if (m.start > cursor) frag.appendChild(document.createTextNode(text.slice(cursor, m.start)));

        const span = document.createElement("span");
        span.className = "rbm-redpen-span";
        span.textContent = text.slice(m.start, m.end);
        frag.appendChild(span);

        const note = document.createElement("span");
        note.className = "rbm-redpen-note";

        const warn = document.createElement("span");
        warn.className = "rbm-redpen-warn";
        warn.textContent = "⚠";
        note.appendChild(warn);

        const labelText = (m.labels && m.labels.length)
          ? m.labels.join(" • ")
          : (m.label || "");

        note.appendChild(document.createTextNode(
          " " + (mode === "bracket" ? `[${labelText}]` : labelText)
        ));


        frag.appendChild(note);


        cursor = m.end;
      }
      if (cursor < text.length) frag.appendChild(document.createTextNode(text.slice(cursor)));


      el.innerHTML = "";
      el.appendChild(frag);
      return ms.length;
    }

    function clearFromElement(el) {
      if (!el) return;


      if (el.dataset.rbmRedpenOrig) {
        el.innerHTML = el.dataset.rbmRedpenOrig;
        delete el.dataset.rbmRedpenOrig;
        return;
      }


      const notes = el.querySelectorAll?.(".rbm-redpen-note");
      const spans = el.querySelectorAll?.(".rbm-redpen-span");
      notes?.forEach(n => n.remove());
      spans?.forEach(s => s.replaceWith(document.createTextNode(s.textContent || "")));
    }

    return { buildLabelSets, applyToElement, clearFromElement };
  })();
  function ragebaitTier(score){
    const s = clamp(Number(score) || 0);

    if (s <= 5)   return { tier: "F",   text: "F TIER - NOT RAGEBAIT" };
    if (s <= 20)  return { tier: "D",   text: "D TIER RAGEBAIT" };     
    if (s <= 30)  return { tier: "C",   text: "C TIER RAGEBAIT" };
    if (s <= 40)  return { tier: "B",   text: "B TIER RAGEBAIT" };
    if (s <= 50)  return { tier: "A",   text: "A TIER RAGEBAIT" };
    if (s <= 60)  return { tier: "S",  text: "S TIER RAGEBAIT" };
    if (s <= 70)  return { tier: "S+",  text: "S+ TIER RAGEBAIT" };
    return         { tier: "S++", text: "S++ TIER RAGEBAIT" };
  }
  
  function isSTierOrAbove(score) {
    const t = ragebaitTier(score)?.tier || "F";
    return (t === "S" || t === "S+" || t === "S++");
  }
  const RBM_VOLCANO_RAIN = (() => {
    const ID = "rbm-volcano-rain";
    let intervalId = null;
    let totalSpawned = 0;
    let killTimer = null;

    const MIN_SIZE = 18;
    const MAX_SIZE = 56;
    const MIN_DURATION = 2.5;
    const MAX_DURATION = 6.5;
    const WIND = 40;

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function ensureContainer() {
      let c = document.getElementById(ID);
      if (c) return c;

      c = document.createElement("div");
      c.id = ID;
      c.style.cssText = [
        "position:fixed",
        "inset:0",
        "pointer-events:none",
        "overflow:hidden",
        "z-index:2147483647"
      ].join(";");

      const s = document.createElement("style");
      s.id = ID + "-style";
      s.textContent = `
        #${ID} .drop{
          position:absolute;
          top:-10vh;
          will-change:transform;
          filter: drop-shadow(0 2px 2px rgba(0,0,0,0.25));
          user-select:none;
        }
      `;
      document.documentElement.appendChild(s);
      document.documentElement.appendChild(c);
      return c;
    }

    function spawnOne(container) {
      const el = document.createElement("div");
      el.className = "drop";
      el.textContent = "🌋";

      const vw = window.innerWidth;
      const startX = rand(0, vw);
      const size = rand(MIN_SIZE, MAX_SIZE);
      const duration = rand(MIN_DURATION, MAX_DURATION);

      const drift = rand(-WIND, WIND);
      const rotate = rand(-40, 40);

      el.style.left = `${startX}px`;
      el.style.fontSize = `${size}px`;

      container.appendChild(el);

      const anim = el.animate(
        [
          { transform: `translate(0, 0) rotate(${rotate}deg)`, opacity: 1 },
          {
            transform: `translate(${drift}px, ${window.innerHeight + 200}px) rotate(${rotate + rand(-90, 90)}deg)`,
            opacity: 1
          }
        ],
        { duration: duration * 1000, easing: "linear", fill: "forwards" }
      );

      anim.onfinish = () => el.remove();
    }

    function stopSpawning() {
      if (!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
    }

    function hardClear() {
      stopSpawning();
      const c = document.getElementById(ID);
      if (c) c.remove();
      const s = document.getElementById(ID + "-style");
      if (s) s.remove();
    }

    // fireOnce(ms, spawnPerSecond, onStopped)
    function fireOnce(ms = 3000, spawnPerSecond = 20, onStopped) {
      spawnPerSecond = Number(spawnPerSecond) || 0;
      if (spawnPerSecond <= 0) return;

      if (killTimer) { clearTimeout(killTimer); killTimer = null; }
      hardClear();

      const container = ensureContainer();
      intervalId = setInterval(() => spawnOne(container), 1000 / spawnPerSecond);

      killTimer = setTimeout(() => {
        stopSpawning();
        killTimer = null;
        try { if (typeof onStopped === "function") onStopped(); } catch {}
        // drops finish naturally
      }, ms);
    }

    return { fireOnce, hardClear };
  })();
  const RBM_EDGE_CATS = (() => {
    const ID = "rbm-edge-cats";
    const STYLE_ID = "rbm-edge-cats-style";

    const CENTER_SAFE_W = 0.55;
    const CENTER_SAFE_H = 0.55;
    const EDGE_BAND = 140;

    const CAT_INTERVAL_MS = 6000;
    const CAT_LIFETIME_MS = 9000;
    const MAX_CATS = 3;

    let intervalId = null;

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function ensure() {
      let layer = document.getElementById(ID);
      if (!layer) {
        layer = document.createElement("div");
        layer.id = ID;
        layer.style.cssText = [
          "position:fixed",
          "inset:0",
          "pointer-events:none",
          "z-index:2147483646",
          "overflow:hidden"
        ].join(";");
        document.documentElement.appendChild(layer);
      }

      if (!document.getElementById(STYLE_ID)) {
        const s = document.createElement("style");
        s.id = STYLE_ID;
        s.textContent = `
          #${ID} .cat{
            position:fixed;
            width:min(260px, 22vw);
            height:auto;
            border-radius:12px;
            box-shadow:0 10px 30px rgba(0,0,0,0.35);
            transform:scale(0.85);
            opacity:0;
            will-change:transform, opacity;
            animation: rbmCatIn 260ms ease-out forwards;
          }
          @keyframes rbmCatIn { to { transform:scale(1); opacity:1; } }
          #${ID} .cat.out{ animation: rbmCatOut 600ms ease-in forwards; }
          @keyframes rbmCatOut { to { transform:scale(0.96); opacity:0; } }
        `;
        document.documentElement.appendChild(s);
      }

      return layer;
    }

    function getSafeBox(vw, vh) {
      const safeW = vw * CENTER_SAFE_W;
      const safeH = vh * CENTER_SAFE_H;
      const left = (vw - safeW) / 2;
      const top = (vh - safeH) / 2;
      return { left, top, right: left + safeW, bottom: top + safeH };
    }

    function overlaps(a, b) {
      return a.left < b.right && a.right > b.left &&
            a.top < b.bottom && a.bottom > b.top;
    }

    function pickEdgePosition(w, h) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const safe = getSafeBox(vw, vh);

      let x, y;
      const edge = Math.floor(rand(0, 4));

      if (edge === 0) { // left
        x = rand(8, EDGE_BAND);
        y = rand(8, vh - h - 8);
      } else if (edge === 1) { // right
        x = rand(vw - EDGE_BAND - w, vw - w - 8);
        y = rand(8, vh - h - 8);
      } else if (edge === 2) { // top
        x = rand(8, vw - w - 8);
        y = rand(8, EDGE_BAND);
      } else { // bottom
        x = rand(8, vw - w - 8);
        y = rand(vh - EDGE_BAND - h, vh - h - 8);
      }

      const box = { left: x, top: y, right: x + w, bottom: y + h };
      if (overlaps(box, safe)) {
        x = (x + w / 2 < vw / 2)
          ? rand(8, EDGE_BAND)
          : rand(vw - EDGE_BAND - w, vw - w - 8);
      }
      return { x, y };
    }

    function spawnCat() {
      const layer = ensure();
      if (layer.children.length >= MAX_CATS) return;

      const img = document.createElement("img");
      img.className = "cat";

      const estW = Math.min(260, Math.round(window.innerWidth * 0.22));
      const estH = estW;

      const { x, y } = pickEdgePosition(estW, estH);
      img.style.left = `${Math.round(x)}px`;
      img.style.top  = `${Math.round(y)}px`;

      img.decoding = "async";
      img.loading = "eager";
      img.referrerPolicy = "no-referrer"; // reduces some site-side blocks

      img.src = "https://cataas.com/cat?width=520&height=520&rand=" + Math.random();

      layer.appendChild(img);
      totalSpawned++;   
      setCatCountUI(totalSpawned);

      setTimeout(() => img.classList.add("out"), CAT_LIFETIME_MS - 600);
      setTimeout(() => img.remove(), CAT_LIFETIME_MS);
    }

    function start() {
      if (intervalId) return;
      ensure();
      totalSpawned = 0;
      setCatCountUI(totalSpawned);
      spawnCat(); // first one immediately
      intervalId = setInterval(spawnCat, CAT_INTERVAL_MS);
    }

    function stop() {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
      const layer = document.getElementById(ID);
      if (layer) layer.remove();
      const s = document.getElementById(STYLE_ID);
      if (s) s.remove();
      totalSpawned = 0;
      setCatCountUI(totalSpawned);

    }

    return { start, stop };
  })();
  function tierFromScore(score) {
    return (ragebaitTier(score)?.tier || "F"); // "F","D","C","B","A","S","S+","S++"
  }

  function volcanoRateForTier(tier) {
    // noticeably lower density as tier drops; F = none
    switch (tier) {
      case "S++": return 30;
      case "S+":  return 22;
      case "S":   return 16;
      case "A":   return 10;
      case "B":   return 7;
      case "C":   return 5;
      default:    return 0; // F
    }
  }


  async function main() {
    try {
      const settings = await getSettings();
      if (!settings.enabled) return;

      await waitForContent();

      const host = getHost();
      const baseline = settings.siteBaselines?.[host];

      const { title, paragraphs, elements } = extractParagraphs();
      const redpenTargets = extractRedpenTargets();

      if (!paragraphs || paragraphs.length < 3) return;

      const maxP = (settings.limits?.maxParagraphs ?? settings.ml?.maxParagraphs) ?? 24;
      const maxC = (settings.limits?.maxCharsPerParagraph ?? settings.ml?.maxCharsPerParagraph) ?? 800;

      const selected = paragraphs.slice(0, maxP).map(p => p.slice(0, maxC));
      const selectedEls = (elements || []).slice(0, maxP);

      const items = selected.map((p, idx) => ({
        id: hashStr(host + "|" + idx + "|" + p),
        text: p
      }));

      const emotionResults = items.map(it => ({ id: it.id, emotions: RBM_EMO.score(it.text) }));
      const byId = new Map(emotionResults.map(r => [r.id, r.emotions]));

      const triples = [];
      let emoSum = { outrage: 0, threat: 0, doom: 0 };
      let emoN = 0;

      for (const it of items) {
        const em = byId.get(it.id) || {};
        const t = mergeEmotionScore(em);
        triples.push(t);
        emoSum.outrage += t.outrage;
        emoSum.threat += t.threat;
        emoSum.doom += t.doom;
        emoN++;
      }

      const emoAgg = {
        outrage: emoN ? emoSum.outrage / emoN : 0,
        threat: emoN ? emoSum.threat / emoN : 0,
        doom: emoN ? emoSum.doom / emoN : 0
      };

      const fullText = selected.join("\n");
      const tactic = buildTacticSignals(fullText, title);
      const cats = scoreCategories(fullText, title);

      const seriousness = scoreSeriousnessFromLex(fullText);
      const manipulation = computeManipulation({ tactic, emoAgg, cats }, settings, baseline);
      

      const punct01 = punctuationPressure01(tactic.punct);

      createOverlay();
      const overlayEl = document.getElementById("rbm-overlay");
      if (overlayEl) overlayEl.dataset.rbmManipulation = String(manipulation);

      const quoteEl = document.getElementById("rbm-quote");
      if (quoteEl) {
        const t = ragebaitTier(manipulation);
        const tierNow = ragebaitTier(manipulation)?.tier || "F";
        const catSec = document.getElementById("rbm-catsec");

        if (catSec) {
          const showCats = (tierNow === "S" || tierNow === "S+" || tierNow === "S++");
          catSec.style.display = showCats ? "block" : "none";
          if (showCats) setCatCountUI(0);
        }

        quoteEl.textContent = t.text;
        quoteEl.classList.remove(
          "rbm-tier-f","rbm-tier-d","rbm-tier-c","rbm-tier-b","rbm-tier-a",
          "rbm-tier-s","rbm-tier-splus","rbm-tier-splusplus"
        );
        const cls =
          t.tier === "S++" ? "rbm-tier-splusplus" :
          t.tier === "S+"  ? "rbm-tier-splus" :
          t.tier === "S"   ? "rbm-tier-s" :
          t.tier === "A"   ? "rbm-tier-a" :
          t.tier === "B"   ? "rbm-tier-b" :
          t.tier === "C"   ? "rbm-tier-c" :
          t.tier === "D"   ? "rbm-tier-d" : "rbm-tier-f";
        quoteEl.classList.add(cls);
      }


      const hostEl = document.getElementById("rbm-host");
      if (hostEl) hostEl.textContent = host;

      const manipEl = document.getElementById("rbm-manip");
      const serEl = document.getElementById("rbm-ser");
      if (manipEl) manipEl.textContent = `${Math.round(manipulation)}/100`;
      if (serEl) serEl.textContent = `${Math.round(seriousness)}/100`;
      setBar("rbm-manip-bar", manipulation);
      setBar("rbm-ser-bar", seriousness);

      const subtopics = computeSubtopics0to100({ tactic, cats, emoAgg, punct01 });

      const radarLabels = ["Outrage","Threat","Doom","Urgency","Dehumanize","Narrative"];
      const radarVals = aggregateAxes0to100(subtopics, emoAgg, tactic, cats);

      const radarDisplayVals = radarVals.map(v => boostDisplayOnly(v, 2.6));

      renderRadarProfile(radarVals, radarLabels, radarDisplayVals);
      requestAnimationFrame(() => renderRadarProfile(radarVals, radarLabels, radarDisplayVals));
      setTimeout(() => renderRadarProfile(radarVals, radarLabels, radarDisplayVals), 80);

      renderEmotionSummary(emoAgg, punct01);

      renderHotspots(triples, selectedEls);

      renderSignals(tactic, emoAgg, cats, subtopics);


      setDebug(
        `p=${paragraphs.length} used=${selected.length} emo=${emotionResults.length} mode=local cats=${Object.keys(cats || {}).length}`
      );

      updateSiteBaseline(host, manipulation).catch(() => {});

      const scored = triples.map((t, i) => ({ i, s: hotspotScore(t) }));
      scored.sort((a, b) => b.s - a.s);
      const hot = new Set(scored.slice(0, Math.max(2, Math.floor(scored.length * 0.2))).map(x => x.i));
      let redpenOn = false;
      let redpenMode = "strike";
      const redpenSets = RBM_REDPEN.buildLabelSets();

      const redpenBtn = document.getElementById("rbm-toggle-redpen");
      if (redpenBtn) {
        redpenBtn.title = `Mode: ${redpenMode} (right-click to toggle)`;

        redpenBtn.oncontextmenu = (e) => {
          e.preventDefault();
          redpenMode = (redpenMode === "strike") ? "bracket" : "strike";
          redpenBtn.title = `Mode: ${redpenMode} (right-click to toggle)`;

          if (redpenOn) {
            for (let idx = 0; idx < (selectedEls?.length || 0); idx++) {
              RBM_REDPEN.clearFromElement(selectedEls[idx]);
              RBM_REDPEN.applyToElement(selectedEls[idx], redpenSets, redpenMode);
            }
            setDebug(`redpen=on mode=${redpenMode}`);
          }

        };

        redpenBtn.addEventListener("click", (e) => {
          if (e.altKey) {
            redpenMode = (redpenMode === "strike") ? "bracket" : "strike";
            redpenBtn.title = `Mode: ${redpenMode} (right-click to toggle)`;
          }

          redpenOn = !redpenOn;

          if (redpenOn) {
            let total = 0;
            for (let idx = 0; idx < (redpenTargets?.length || 0); idx++) {
              total += RBM_REDPEN.applyToElement(redpenTargets[idx], redpenSets, redpenMode);
            }


            setDebug(`redpen=on mode=${redpenMode} marks=${total} hot=${hot.size}`);
          } else {
            for (let idx = 0; idx < (redpenTargets?.length || 0); idx++) {
              RBM_REDPEN.clearFromElement(redpenTargets[idx]);
            }
            setDebug(`redpen=off`);
          }
        }, { passive: true });
      }
      let blurOn = false;
      const blurBtn = document.getElementById("rbm-toggle-blur");
      if (blurBtn) blurBtn.onclick = () => {
        blurOn = !blurOn;
        blurHotElements(blurOn, hot, selectedEls);
      };

      const recalcBtn = document.getElementById("rbm-recalc");
      if (recalcBtn) recalcBtn.onclick = () => location.reload();

      if (settings.interventions?.cooldownOnHigh && manipulation >= 75) {
        const seconds = Math.max(0, settings.interventions.cooldownSeconds || 0);
        if (seconds > 0) {
          const blocker = document.createElement("div");
          blocker.className = "rbm-blocker";
          document.documentElement.appendChild(blocker);

          let t = seconds;
          blocker.textContent = `Cooldown: ${t}s`;
          const iv = setInterval(() => {
            t--;
            blocker.textContent = `Cooldown: ${t}s`;
            if (t <= 0) { clearInterval(iv); blocker.remove(); }
          }, 1000);
        }
      }
    } catch (err) {
      try {
        createOverlay();
        {
          const btn = document.getElementById("rbm-toggle-redpen");
          if (btn) {
            const fresh = btn.cloneNode(true);
            fresh.removeAttribute("data-rbm-bound-redpen");
            fresh.title = "";
            btn.replaceWith(fresh);
          }
        }
        setDebug(`ERROR: ${String(err?.stack || err?.message || err)}`);
      } catch {}
    }
  }

  main();
})();
