/**
 * Language Ramp — controls how much L2 appears in AI responses
 * and which words the AI picks based on proficiency.
 *
 * See docs/impl.md section 6 for the formal spec.
 */

const PROFICIENCY_LEVELS = ["novice", "intermediate", "advanced", "fluent"];

const PROFICIENCY_MODIFIERS = {
  novice:       { vocab: "top 1000",  maxSentenceLen: 10, idioms: false },
  intermediate: { vocab: "top 3000",  maxSentenceLen: 15, idioms: "rare" },
  advanced:     { vocab: "full",      maxSentenceLen: null, idioms: "occasional" },
  fluent:       { vocab: "unrestricted", maxSentenceLen: null, idioms: true },
};

/**
 * Determine the current ratio band (A-E) from a ramp ratio.
 */
function getBand(ratio) {
  if (ratio < 0.2) return "A";
  if (ratio < 0.4) return "B";
  if (ratio < 0.6) return "C";
  if (ratio < 0.8) return "D";
  return "E";
}

/**
 * Describe what the AI should do at a given band + proficiency.
 * This gets injected into the system prompt.
 */
function getMixingInstructions(band, proficiency) {
  const mod = PROFICIENCY_MODIFIERS[proficiency] || PROFICIENCY_MODIFIERS.novice;

  const bandDescriptions = {
    A: `Respond in L1 with 1-2 L2 words per sentence. Each L2 word MUST be guessable from the surrounding L1 context. On first use of an L2 word, add a brief L1 gloss (e.g. "that is wirklich — really — frustrating"). On subsequent uses, no gloss needed.`,
    B: `Respond mostly in L1 but include L2 phrases or short clauses. Use the pattern: L2 phrase — L1 restatement. Keep it natural, no word salad.`,
    C: `Mix L1 and L2 evenly. Use the pattern: L2 sentence, then L1 fallback if the meaning is unclear. The user should be reading L2 with L1 safety net.`,
    D: `Respond mostly in L2. Insert L1 words only when the L2 word is likely unknown. Keep the flow natural.`,
    E: `Respond entirely in L2. Full natural language, no simplification.`,
  };

  const lengthNote = mod.maxSentenceLen
    ? `Keep sentences short (${mod.maxSentenceLen} words max).`
    : "Use natural sentence length.";

  const idiomNote = mod.idioms === false
    ? "No idioms or slang."
    : mod.idioms === "rare"
    ? "Use idioms rarely."
    : mod.idioms === "occasional"
    ? "Occasional idioms are fine."
    : "Full range of idioms and slang.";

  return [
    `RATIO BAND ${band}: ${bandDescriptions[band]}`,
    `PROFICIENCY (${proficiency}): Use ${mod.vocab} L2 vocabulary. ${lengthNote} ${idiomNote}`,
    `RULES: Never insert L2 into emotionally charged moments (user venting/angry). Grammar must stay natural — no mixed-language word salad.`,
  ].join("\n");
}

/**
 * Detect signals from user message that affect ramp ratio.
 * Returns a delta to apply to the current ratio.
 */
function detectSignal(message, l2) {
  const lower = message.toLowerCase();
  let delta = 0;

  // User asks "what does X mean" → struggling
  if (/what (does|is|means?) .+/i.test(lower) || /was heißt|was bedeutet/i.test(lower)) {
    delta -= 0.02;
  }

  // Rough L2 detection: check if message contains words in L2 script or common L2 patterns
  // This is a heuristic — for Latin-script languages it's hard, so we keep it simple
  const l2Patterns = {
    de: /\b(der|die|das|und|ist|ich|du|wir|nicht|ein|eine|mit|auf|für|haben|sein|werden|aber|auch|noch|schon|wirklich|sehr)\b/i,
    fr: /\b(le|la|les|de|des|et|un|une|est|sont|je|tu|nous|vous|avec|pour|pas|mais|aussi|très)\b/i,
    es: /\b(el|la|los|las|de|en|es|un|una|y|que|no|por|con|para|pero|más|muy|también)\b/i,
    ru: /\b(и|в|на|с|что|это|как|не|он|она|но|да|очень|тоже|ещё|уже)\b/i,
    ja: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,
    zh: /[\u4E00-\u9FFF]/,
    ko: /[\uAC00-\uD7AF]/,
  };

  const pattern = l2Patterns[l2];
  if (pattern && pattern.test(lower)) {
    // Count L2 word density
    const matches = lower.match(pattern) || [];
    const wordCount = lower.split(/\s+/).length;
    const density = matches.length / wordCount;

    if (density > 0.5) {
      delta += 0.03; // user writes heavily in L2
    } else if (density > 0.2) {
      delta += 0.02; // user mixes some L2
    } else {
      delta -= 0.01; // user responds mostly in L1
    }
  } else {
    delta -= 0.01; // no L2 detected
  }

  return delta;
}

/**
 * Apply a signal delta to the current ratio, clamped to [0, 1].
 */
function applyDelta(currentRatio, delta) {
  return Math.max(0, Math.min(1, currentRatio + delta));
}

/**
 * Calculate the starting ratio for a new session.
 * Slight regression from previous session so user isn't dropped in cold.
 */
function getStartRatio(previousRatio, sessionCount) {
  const baselineFloor = sessionCount >= 5
    ? Math.min(0.8, 0.1 + sessionCount * 0.02)
    : 0.1;
  const regressed = previousRatio != null
    ? Math.max(baselineFloor, previousRatio - 0.05)
    : baselineFloor;
  return Math.max(0.1, regressed);
}

/**
 * Build the full system prompt section for language mixing.
 */
const LANG_NAMES = {
  en: 'English', de: 'German', fr: 'French', es: 'Spanish',
  it: 'Italian', pt: 'Portuguese', lv: 'Latvian', lt: 'Lithuanian',
  ru: 'Russian',
};

function buildRampPrompt({ l1, l2, proficiency, rampRatio }) {
  const band = getBand(rampRatio);
  const l1Name = LANG_NAMES[l1] || l1;
  const l2Name = LANG_NAMES[l2] || l2;
  return [
    `LANGUAGES: User speaks ${l1Name} (strong) and is learning ${l2Name} (target).`,
    `Your role: conversational friend, NOT a teacher. Keep it natural.`,
    getMixingInstructions(band, proficiency),
  ].join("\n\n");
}

module.exports = {
  getBand,
  getMixingInstructions,
  detectSignal,
  applyDelta,
  getStartRatio,
  buildRampPrompt,
  PROFICIENCY_LEVELS,
};
