(() => {
  const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  function normCount(text, arr) {
    const t = (text || "").toLowerCase();
    let c = 0;
    for (const w of (arr || [])) {
      const pat = esc(String(w).toLowerCase());
      const re = new RegExp("\\b" + pat + "\\b", "g");
      const m = t.match(re);
      if (m) c += m.length;
    }
    return c;
  }

  window.RBM_TAXON = {
    // --- RAGEBAIT TACTICS (used for manipulation & profile axes) ---
   tactics: {
  OUTRAGE: [
    "disgusting","sickening","appalling","vile","evil","monstrous","barbaric","outrage","unacceptable",
    // additions
    "abhorrent","reprehensible","morally bankrupt","preposterously","beyond the pale","indefensible",
    "shameful","depraved","heinous","atrocious","an absolute disgrace",
    "a slap in the face","an insult to","should disgust everyone"
  ],

  THREAT: [
    "unsafe","danger","threat","terror","crime wave","alarming","panic","risk","crisis",
    // additions
    "public safety risk","national security threat","imminent danger","existential threat",
    "escalating threat","growing danger","out of control","spreading rapidly",
    "poses a serious risk","puts lives at risk"
  ],

  DOOM: [
    "collapse","end of the","ruined","destroyed","doomed","no future","point of no return","nothing will ever",
    // additions
    "irreversible damage","beyond repair","cannot be undone","total failure",
    "the beginning of the end","on the brink of collapse","past the breaking point",
    "systemic failure","complete breakdown","long-term devastation"
  ],

  URGENCY: [
    "act now","right now","before it's too late","wake up","last chance","breaking","this is it",
    // additions
    "time is running out","now or never","immediate action required",
    "we cannot wait","the window is closing","urgent warning",
    "happening as we speak","hours away","just announced"
  ],

  DEHUMANIZE: [
    "rats","cockroaches","parasites","vermin","animals","subhuman",
    // additions
    "infestation","plague","disease","filth","scourge",
    "not human","less than human","savages","beasts","inhuman"
  ],

  HEADLINE_BAIT: [
    "you won't believe","shocking","this changes everything","watch till the end","exposed",
    // additions
    "what happens next","the truth about","this is why","they never told you",
    "goes viral","internet is furious","jaw-dropping",
    "everything you know is wrong","the real reason","here's what they did"
  ],

  // extra signals (still useful for manipulation score, not necessarily in the 6 axes)

  CERTAINTY: [
    "obviously","clearly","undeniable","everyone knows","the truth is","no doubt","no one is talking about",
    // additions
    "without question","there is no debate","it is a fact that",
    "anyone can see","beyond dispute","proven beyond doubt",
    "the reality is","make no mistake","there is only one explanation"
  ],

  EVIDENCE_VAGUE: [
    "sources say","many are saying","people are saying","it is rumored","allegedly","reportedly",
    // additions
    "according to insiders","it is believed that","unconfirmed reports",
    "claims suggest","some experts say","it appears that","apparent",
    "widely believed","rumors are circulating","unnamed sources"
  ],

  AD_HOMINEM: [
    "idiot","moron","clown","scum","trash",
    // additions
    "imbecile","buffoon","degenerate","loser","pathetic",
    "corrupt hack","sellout","useful idiot","grifter"
  ],

  GENERALIZERS: [
    "always","never","all of them","every single","nothing but",
    // additions
    "the entire group","every last one","none of them",
    "nothing ever","the same people","they all","can only mean"
  ],

  CONSPIRACY: [
    "cover-up","they don't want you to know","false flag","psyop","deep state","agenda","shadowy",
    // additions
    "behind the scenes","pulling the strings","manufactured narrative",
    "controlled opposition","secret plan","hidden hand",
    "coordinated effort","engineered crisis","media silence"
  ],

  WHATABOUT: [
    "what about","meanwhile","but when","where was the outrage",
    // additions
    "why is no one talking about","strangely silent on",
    "no one complained when","funny how","selective outrage"
  ],

  IDENTITY: [
    "race","ethnicity","religion","gender","trans","gay","muslim","christian","jewish","white","black",
    // additions
    "immigrant","migrant","refugee","minority","majority",
    "lgbt","straight","cisgender","nationality","culture"
  ],

  PURITY: [
    "real men","real women","good people","patriots","traitors","degenerates","virtue signalling",
    // additions
    "true believers","proper values","decent folk","moral people",
    "traditional values","fake allies","not one of us",
    "betraying our values","moral decay"
  ],

  WAR: [
    "enemy","fight","battle","war on","take them down","crush","eradicate","destroy them",
    // additions
    "combat","front line","under attack","siege","retaliate",
    "strike back","defeat","eliminate","target","fight back"
  ],

  VIOLENCE_HINTS: [
    "should be punished","make them pay","they deserve","hang","shoot","wipe out",
    // additions
    "locked up forever","put them down","deal with them",
    "taught a lesson","pay the price","face consequences",
    "taken care of","removed permanently"
  ]
},




  seriousness: {
    // Physical safety, violence, health, disasters (highest weight)
    HARM: [
      // death / injury / violence
      "killed","killing","dead","death","fatal","fatality","murder","homicide","massacre",
      "injured","injury","wounded","shot","shooting","stabbed","stabbing","beaten","assault",
      "rape","raped","sexual assault","abuse","torture","kidnapped","kidnapping","hostage",
      "terror","terrorist","terrorism","bombing","explosion","attack","armed attack",

      // war / conflict
      "war","civil war","invasion","airstrike","air strike","missile strike","shelling",
      "genocide","ethnic cleansing",

      // public health (use specific terms, not generic "sick")
      "outbreak","epidemic","pandemic","public health emergency",
      "overdose","opioid overdose","fentanyl","poisoning",
      "hospitalized","intensive care","icu","ventilator",

      // disasters (specific)
      "earthquake","tsunami","wildfire","hurricane","cyclone","flooding","flood","landslide",
      "evacuation","evacuated"
    ],

    // Economic/financial stakes, including inflation and employment
    MONEY: [
      // crime / corruption / fraud
      "fraud","scam","con","embezzlement","embezzled","stole","stolen","theft",
      "corruption","bribe","bribery","kickback","money laundering","laundering",
      "insider trading","price fixing","market manipulation",

      // macro / cost of living (specific to avoid false positives)
      "inflation","deflation","stagflation","hyperinflation","cpi","consumer price index",
      "cost of living","price hike","prices surged","rent increase","rent hike",
      "interest rate","rate hike","rate cut","central bank","federal reserve","bank of england",
      "recession","economic downturn","economic contraction","gdp contraction",

      // jobs / labor market (specific)
      "unemployment","jobless","jobless rate","layoff","layoffs","mass layoffs",
      "redundancy","redundancies","furlough","hiring freeze","wage cut","pay cut",
      "wage growth","real wages",

      // markets / institutions
      "bankruptcy","insolvent","insolvency","default","debt default",
      "credit crunch","liquidity crisis","bank run",
      "foreclosure","eviction",
      "stock market crash","market crash"
    ],

    // Civil liberties, discrimination, censorship, legality
    RIGHTS: [
      // legal / constitutional
      "illegal","unlawful","unconstitutional","due process","civil rights",
      "court order","injunction","warrantless","unlawful search",

      // censorship / speech
      "censored","censorship","banned","ban","book ban","deplatformed","deplatforming",
      "press freedom","free speech","speech restrictions",

      // discrimination / oppression (more specific terms)
      "discriminated","discrimination","hate crime","racial discrimination",
      "religious discrimination","gender discrimination","workplace discrimination",
      "harassment","civil liberties","oppressed","oppression",

      // state force / detention
      "detained","detention","arrested","wrongful arrest","political prisoner",
      "surveillance","mass surveillance"
    ]
  },


    // --- EMOTION WORDS (for local emotion scorer only) ---
  

    // modifiers for emotion scorer
    modifiers: {
      INTENS: ["very","extremely","incredibly","deeply","totally","absolutely","highly","insanely","so","too"],
      NEG: ["not","never","no","without","hardly","rarely"]
    }
  };

  // 6-corner ragebait profile definition (axis -> which tactic buckets feed it)
  window.RBM_PROFILE = {
    axes: [
      { key: "OUTRAGE",       label: "Outrage",    from: ["OUTRAGE"] },
      { key: "THREAT",        label: "Threat",     from: ["THREAT","WAR","VIOLENCE_HINTS"] },
      { key: "DOOM",          label: "Doom",       from: ["DOOM"] },
      { key: "URGENCY",       label: "Urgency",    from: ["URGENCY","CERTAINTY"] },
      { key: "DEHUMANIZE",    label: "Dehumanize", from: ["DEHUMANIZE","AD_HOMINEM"] },
      { key: "HEADLINE_BAIT", label: "Headline",   from: ["HEADLINE_BAIT"] }
    ],
    weights: {
      OUTRAGE: { OUTRAGE: 1.0 },
      THREAT: { THREAT: 1.0, WAR: 0.7, VIOLENCE_HINTS: 0.8 },
      DOOM: { DOOM: 1.0 },
      URGENCY: { URGENCY: 1.0, CERTAINTY: 0.6 },
      DEHUMANIZE: { DEHUMANIZE: 1.0, AD_HOMINEM: 0.7 },
      HEADLINE_BAIT: { HEADLINE_BAIT: 1.0 }
    }
  };

  // Back-compat shim used by content.js today
  window.RBM_LEX = window.RBM_LEX || {};
  window.RBM_LEX.normCount = normCount;
  window.RBM_LEX.LEX = {
    outrage: window.RBM_TAXON.tactics.OUTRAGE,
    certainty: window.RBM_TAXON.tactics.CERTAINTY,
    urgency: window.RBM_TAXON.tactics.URGENCY,
    generalizers: window.RBM_TAXON.tactics.GENERALIZERS,
    adHominem: window.RBM_TAXON.tactics.AD_HOMINEM,
    dehumanize: window.RBM_TAXON.tactics.DEHUMANIZE,
    evidenceHedges: window.RBM_TAXON.tactics.EVIDENCE_VAGUE,
    seriousness: {
      harm: window.RBM_TAXON.seriousness.HARM,
      money: window.RBM_TAXON.seriousness.MONEY,
      rights: window.RBM_TAXON.seriousness.RIGHTS
    }
  };

  // Optional: legacy window.RBM_CATS for older code paths
  // (safe to keep even if unused)
  window.RBM_CATS = {
    // ragebait tactics (mapped)
    MORAL_SHOCK: window.RBM_TAXON.tactics.OUTRAGE,
    BETRAYAL: ["traitor","sold out","backstab","betrayed","corrupt","cronies","they lied"], // keep if you still want it
    SCAPEGOAT: ["alt-right","these people","those people","immigrants","elites","woke","leftists","right-wingers"],

    DEHUMANIZE: window.RBM_TAXON.tactics.DEHUMANIZE,
    URGENCY: window.RBM_TAXON.tactics.URGENCY,
    CERTAINTY: window.RBM_TAXON.tactics.CERTAINTY,
    CONSPIRACY: window.RBM_TAXON.tactics.CONSPIRACY,
    EVIDENCE_VAGUE: window.RBM_TAXON.tactics.EVIDENCE_VAGUE,
    IDENTITY: window.RBM_TAXON.tactics.IDENTITY,
    PURITY_TESTS: window.RBM_TAXON.tactics.PURITY,
    FEAR_FRAME: window.RBM_TAXON.tactics.THREAT,
    DOOM_FRAME: window.RBM_TAXON.tactics.DOOM,
    WAR_LANGUAGE: window.RBM_TAXON.tactics.WAR,
    VIOLENCE_HINTS: window.RBM_TAXON.tactics.VIOLENCE_HINTS,
    STRAWMAN: ["so you're saying","let me guess","of course you think","typical of"],
    LOADED_Q: ["why are they","how can anyone","what kind of person"],
    WHATABOUT: window.RBM_TAXON.tactics.WHATABOUT,
    CALL_TO_ANGER: ["share this","spread the word","don't ignore","everyone must see","wake up people"],
    CLICKBAIT: window.RBM_TAXON.tactics.HEADLINE_BAIT
  };
})();
