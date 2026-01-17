README:
# Ragebait Meter – Chrome Extension

A Chrome extension that analyzes online articles to detect, highlight, and score **ragebait language** using a curated word bank and contextual analysis.  
The extension produces a **ragebait score**, highlights detected terms directly in the article, and provides an **explanation of why the content may be emotionally manipulative**.

---

## What this does

Ragebait Meter scans article text and:
- Detects emotionally charged, inflammatory, or manipulative words
- Highlights detected words in the article
- Calculates a **ragebait intensity score**
- Generates a short **analysis explaining the score**
- Features such as **RageBlur** and **RedPenning**

The goal is to help readers become more aware of emotional framing and manipulation in online content.

---

## How it works (high level)

1. Extracts article text from the active webpage
2. Compares words and phrases against a **ragebait word bank**
3. Applies weighting rules (frequency, intensity, repetition)
4. Highlights detected terms in-page
5. Outputs:
   - Ragebait score
   - Breakdown of detected terms
   - Short interpretive analysis

---

