/**
 * Endgame — LLM-led recall game.
 *
 * The LLM gets the captured word list + contexts in its prompt.
 * It reports progress via inline markers: [RECALL:{"word":"x","correct":true}]
 * Backend parses markers, strips them from visible text, tracks state.
 */

// In-memory game state (per process)
const games = new Map();

function createGame(sessionId, words) {
  const id = `eg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const game = {
    id,
    sessionId,
    words: words.map((w) => ({
      word: w.word,
      context: w.context_text,
      frequency: w.frequency_count,
      recalled: false,
      correct: false,
    })),
    stepCount: 0,
    complete: false,
    history: [],
  };
  games.set(id, game);
  return game;
}

function getGame(endgameId) {
  return games.get(endgameId);
}

/**
 * Parse [RECALL:{"word":"x","correct":true}] markers from LLM response.
 * Returns { cleanText, results[] }.
 */
function parseMarkers(text) {
  const results = [];
  const clean = text.replace(/\[RECALL:\s*(\{[^}]+\})\]/g, (_, json) => {
    try {
      const parsed = JSON.parse(json);
      results.push(parsed);
    } catch {}
    return "";
  });
  return { cleanText: clean.trim(), results };
}

/**
 * Apply recall results to game state.
 */
function applyResults(endgameId, results) {
  const game = games.get(endgameId);
  if (!game) return null;

  for (const { word, correct } of results) {
    const w = game.words.find(
      (g) => g.word.toLowerCase() === word.toLowerCase()
    );
    if (w) {
      w.recalled = true;
      w.correct = correct;
    }
  }

  if (game.words.every((w) => w.recalled)) {
    game.complete = true;
  }

  return game;
}

function incrementStep(endgameId) {
  const game = games.get(endgameId);
  if (game) game.stepCount++;
}

/**
 * Build the system prompt for the endgame LLM.
 * Includes word list, progress, and step-based nudging.
 */
function buildEndgamePrompt(game) {
  const remaining = game.words.filter((w) => !w.recalled);
  const done = game.words.filter((w) => w.recalled);

  const wordList = remaining
    .map(
      (w) =>
        `• "${w.word}" — Original context: "${w.context || "no context"}"`
    )
    .join("\n");

  const doneSummary =
    done.length > 0
      ? `\nAlready covered: ${done.map((w) => `"${w.word}" (${w.correct ? "got it" : "missed"})`).join(", ")}`
      : "";

  // Nudging by step count
  let nudge;
  const s = game.stepCount;
  if (s < 4) {
    nudge = "Take your time. Be warm and encouraging.";
  } else if (s < 8) {
    nudge = "Good pace. Keep the energy up.";
  } else if (s < 12) {
    nudge = "Pick up the pace. Give hints if the user is struggling.";
  } else {
    nudge = "Wrap up soon. If the user doesn't know a word, tell them and move on.";
  }

  return [
    `ENDGAME — Recall Game`,
    `You are leading a fun recall game. You're a friend quizzing another friend over drinks, NOT a teacher.`,
    `The user captured these words during a conversation. Test if they remember what they mean.`,
    `Use the original context sentences as hints when they're stuck.`,
    ``,
    `WORDS TO COVER (${remaining.length} remaining of ${game.words.length} total):`,
    wordList,
    doneSummary,
    ``,
    `PROGRESS NUDGE: ${nudge}`,
    ``,
    `REPORTING: When you assess whether the user knows a word, include this marker in your response:`,
    `[RECALL:{"word":"the_word","correct":true_or_false}]`,
    `You can include multiple markers. Report a word as soon as the user demonstrates knowledge or lack thereof.`,
    `The user will NOT see these markers.`,
    ``,
    `RULES:`,
    `- Don't list all words at once. Go one by one or in small groups.`,
    `- Be playful. Celebrate correct answers.`,
    `- Be gentle on mistakes — give hints from the context before revealing.`,
    `- Stay conversational, not quiz-like.`,
    `- When all words are covered, give a warm summary and say the game is done.`,
  ].join("\n");
}

/**
 * Get summary stats for a completed game.
 */
function getSummary(endgameId) {
  const game = games.get(endgameId);
  if (!game) return null;

  return {
    total: game.words.length,
    correct: game.words.filter((w) => w.correct).length,
    incorrect: game.words.filter((w) => w.recalled && !w.correct).length,
    words: game.words,
    steps: game.stepCount,
  };
}

module.exports = {
  createGame,
  getGame,
  parseMarkers,
  applyResults,
  incrementStep,
  buildEndgamePrompt,
  getSummary,
};
