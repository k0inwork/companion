require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const ramp = require("./ramp");
const llm = require("./llm");
const endgame = require("./endgame");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Create user profile
app.post("/user", async (req, res) => {
  const { id, l1, l2, proficiency } = req.body || {};
  if (!id || !l1 || !l2) {
    return res.status(400).json({ error: "id, l1, l2 are required" });
  }
  const prof = ramp.PROFICIENCY_LEVELS.includes(proficiency) ? proficiency : "novice";
  try {
    await db.query(
      "INSERT INTO user_profile (id, l1, l2, proficiency) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET l1=$2, l2=$3, proficiency=$4, updated_at=NOW()",
      [id, l1, l2, prof]
    );
    res.json({ id, l1, l2, proficiency: prof });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create session (uses user profile for language settings)
app.post("/session", async (req, res) => {
  const { user_id, l1, l2, proficiency, ramp_mode, start_ratio } = req.body || {};
  const id = `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    let sessionL1 = l1 || "en";
    let sessionL2 = l2 || "de";

    // If user_id provided, fetch profile defaults
    if (user_id) {
      const result = await db.query("SELECT * FROM user_profile WHERE id = $1", [user_id]);
      if (result.rows.length > 0) {
        const profile = result.rows[0];
        sessionL1 = sessionL1 === "en" && profile.l1 ? profile.l1 : sessionL1;
        sessionL2 = sessionL2 === "de" && profile.l2 ? profile.l2 : sessionL2;
      }
    }

    // Calculate start ratio based on previous sessions
    let ratio;
    if (start_ratio != null) {
      ratio = start_ratio;
    } else {
      const prevResult = await db.query(
        "SELECT ramp_ratio FROM session WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
        [user_id || null]
      );
      const prevRatio = prevResult.rows[0]?.ramp_ratio;
      const sessionCount = await db.query(
        "SELECT COUNT(*) as count FROM session WHERE user_id = $1",
        [user_id || null]
      );
      ratio = ramp.getStartRatio(prevRatio, parseInt(sessionCount.rows[0]?.count || "0"));
    }

    const mode = ramp_mode === "manual" ? "manual" : "auto";

    await db.query(
      "INSERT INTO session (id, user_id, l1, l2, ramp_ratio, ramp_mode) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, user_id || null, sessionL1, sessionL2, ratio, mode]
    );

    const band = ramp.getBand(ratio);
    res.json({ id, l1: sessionL1, l2: sessionL2, ramp_ratio: ratio, band, ramp_mode: mode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current ramp state for a session
app.get("/session/:id/ramp", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM session WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "session not found" });
    }
    const session = result.rows[0];
    res.json({
      l1: session.l1,
      l2: session.l2,
      ramp_ratio: session.ramp_ratio,
      band: ramp.getBand(session.ramp_ratio),
      ramp_mode: session.ramp_mode,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manually set ramp ratio (for manual mode or override)
app.patch("/session/:id/ramp", async (req, res) => {
  const { ratio, mode } = req.body || {};
  try {
    const updates = [];
    const values = [];
    let idx = 1;

    if (ratio != null) {
      updates.push(`ramp_ratio = $${idx++}`);
      values.push(Math.max(0, Math.min(1, ratio)));
    }
    if (mode) {
      updates.push(`ramp_mode = $${idx++}`);
      values.push(mode === "manual" ? "manual" : "auto");
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "provide ratio or mode" });
    }

    values.push(req.params.id);
    await db.query(`UPDATE session SET ${updates.join(", ")} WHERE id = $${idx}`, values);

    const result = await db.query("SELECT * FROM session WHERE id = $1", [req.params.id]);
    const session = result.rows[0];
    res.json({
      ramp_ratio: session.ramp_ratio,
      band: ramp.getBand(session.ramp_ratio),
      ramp_mode: session.ramp_mode,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat endpoint — main conversation loop
app.post("/chat", async (req, res) => {
  const { session_id, message } = req.body || {};
  if (!session_id || !message) {
    return res.status(400).json({ error: "session_id and message are required" });
  }

  try {
    // Fetch session
    const sessionResult = await db.query("SELECT * FROM session WHERE id = $1", [session_id]);
    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: "session not found" });
    }
    const session = sessionResult.rows[0];

    // Fetch user proficiency
    let proficiency = "novice";
    if (session.user_id) {
      const userResult = await db.query("SELECT proficiency FROM user_profile WHERE id = $1", [session.user_id]);
      proficiency = userResult.rows[0]?.proficiency || "novice";
    }

    // Build system prompt from ramp state
    const systemPrompt = ramp.buildRampPrompt({
      l1: session.l1,
      l2: session.l2,
      proficiency,
      rampRatio: session.ramp_ratio,
    });

    // Fetch recent message history (last 20 messages for context)
    const historyResult = await db.query(
      "SELECT role, content FROM message WHERE session_id = $1 ORDER BY timestamp DESC LIMIT 20",
      [session_id]
    );
    const history = historyResult.rows.reverse().map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Add user message to history
    history.push({ role: "user", content: message });

    // Call LLM
    let response;
    if (process.env.OPENAI_API_KEY) {
      try {
        response = await llm.chat(systemPrompt, history);
      } catch (err) {
        console.error("LLM error:", err.message);
        response = null;
      }
    }
    if (!response) {
      response = `[dev] LLM unavailable. You said: "${message}". Tell me more.`;
    }

    // Store messages in DB
    await db.query(
      "INSERT INTO message (session_id, role, content) VALUES ($1, $2, $3)",
      [session_id, "user", message]
    );
    await db.query(
      "INSERT INTO message (session_id, role, content) VALUES ($1, $2, $3)",
      [session_id, "assistant", response]
    );

    // Auto-adjust ramp ratio based on user message
    if (session.ramp_mode === "auto") {
      const delta = ramp.detectSignal(message, session.l2);
      const newRatio = ramp.applyDelta(session.ramp_ratio, delta);
      await db.query(
        "UPDATE session SET ramp_ratio = $1 WHERE id = $2",
        [newRatio, session_id]
      );
    }

    res.json({
      response,
      ramp_ratio: session.ramp_mode === "auto"
        ? ramp.applyDelta(session.ramp_ratio, ramp.detectSignal(message, session.l2))
        : session.ramp_ratio,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Radar capture — store a captured word with full sentence context
app.post("/radar", async (req, res) => {
  const { session_id, word, context, media_timestamp } = req.body || {};
  if (!session_id || !word) {
    return res.status(400).json({ error: "session_id and word are required" });
  }

  try {
    // Upsert: if word exists in session, increment count and update context
    const result = await db.query(
      `INSERT INTO radar_item (session_id, word, context_text, media_timestamp, ramp_ratio)
       VALUES ($1, $2, $3, $4, (SELECT ramp_ratio FROM session WHERE id = $1))
       ON CONFLICT (session_id, word) DO UPDATE
       SET frequency_count = radar_item.frequency_count + 1,
           context_text = EXCLUDED.context_text,
           updated_at = NOW()
       RETURNING *`,
      [session_id, word, context || null, media_timestamp || null]
    );

    res.json({
      word: result.rows[0].word,
      frequency: result.rows[0].frequency_count,
      context: result.rows[0].context_text,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all radar captures for a session
app.get("/session/:id/radar", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT word, frequency_count, context_text, ramp_ratio, created_at, updated_at FROM radar_item WHERE session_id = $1 ORDER BY updated_at DESC",
      [req.params.id]
    );
    res.json({ words: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Endgame endpoints ---

// Start endgame for a session
app.post("/endgame/start", async (req, res) => {
  const { session_id } = req.body || {};
  if (!session_id) {
    return res.status(400).json({ error: "session_id is required" });
  }

  try {
    const radarResult = await db.query(
      "SELECT word, context_text, frequency_count FROM radar_item WHERE session_id = $1 ORDER BY updated_at DESC",
      [session_id]
    );

    if (radarResult.rows.length === 0) {
      return res.status(400).json({ error: "no captured words for this session" });
    }

    const game = endgame.createGame(session_id, radarResult.rows);
    const prompt = endgame.buildEndgamePrompt(game);

    // Get first LLM message to kick off the game
    const openingResponse = await llm.chat(prompt, [
      { role: "user", content: "let's play! I'm ready." },
    ]);

    // Parse any markers from the opening
    const { cleanText, results } = endgame.parseMarkers(openingResponse || "");
    if (results.length > 0) {
      endgame.applyResults(game.id, results);
    }
    endgame.incrementStep(game.id);

    res.json({
      endgame_id: game.id,
      total_words: game.words.length,
      response: cleanText || "Hey! Ready to see what you remember?",
      complete: false,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chat within endgame
app.post("/endgame/chat", async (req, res) => {
  const { endgame_id, message } = req.body || {};
  if (!endgame_id || !message) {
    return res.status(400).json({ error: "endgame_id and message are required" });
  }

  try {
    const game = endgame.getGame(endgame_id);
    if (!game) {
      return res.status(404).json({ error: "endgame not found" });
    }
    if (game.complete) {
      const summary = endgame.getSummary(endgame_id);
      return res.json({ response: "Game is already done!", complete: true, summary });
    }

    game.history.push({ role: "user", content: message });
    endgame.incrementStep(endgame_id);

    // Rebuild prompt with updated progress
    const prompt = endgame.buildEndgamePrompt(game);

    let response;
    try {
      response = await llm.chat(prompt, game.history);
    } catch (err) {
      console.error("Endgame LLM error:", err.message);
      response = null;
    }

    if (!response) {
      response = "Hmm, lost my train of thought. Try again?";
    }

    // Parse markers and update state
    const { cleanText, results } = endgame.parseMarkers(response);
    let updatedGame = game;
    if (results.length > 0) {
      updatedGame = endgame.applyResults(endgame_id, results);
    }

    game.history.push({ role: "assistant", content: response });

    const isComplete = updatedGame.complete;
    const summary = isComplete ? endgame.getSummary(endgame_id) : null;

    res.json({
      response: cleanText,
      complete: isComplete,
      ...(summary ? { summary } : {}),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get endgame summary
app.get("/endgame/:id/summary", (req, res) => {
  const summary = endgame.getSummary(req.params.id);
  if (!summary) {
    return res.status(404).json({ error: "endgame not found" });
  }
  res.json(summary);
});

// Serve frontend static files (built React app)
const path = require("path");
app.use(express.static(path.join(__dirname, "../frontend/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build/index.html"));
});

const PORT = process.env.PORT || 8000;

(async () => {
  try {
    await db.migrate();
  } catch (err) {
    console.error("migration failed:", err.message);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log(`Traceback backend on :${PORT}`);
  });
})();
