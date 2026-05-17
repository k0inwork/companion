Got it — you want a **proper engineering MVP spec**, not a product essay.

Here is a clean, implementable version.

---

# Traceback MVP — Engineering Spec (v1.0)

---

# 0. Goal

Build a **web-based terminal-style conversational system** where:

* user chats with AI agent
* user optionally consumes media in same session
* user captures words via Ctrl+Space (Radar)
* user plays Endgame recall game after session

No learning logic during interaction.

---

# 1. System Overview

## Architecture

```text id="arch_v1"
[ Web Frontend (TUI) ]
        |
        | REST/WebSocket
        |
[ Backend API (FastAPI / Node) ]
        |
        | LLM calls
        |
[ AI Provider (GPT/Claude) ]
        |
[ DB (SQLite/Postgres) ]
```

---

# 2. Frontend Spec (Web TUI)

## 2.1 Tech Stack

* React (preferred) or Svelte
* xterm.js OR custom monospace UI
* WebSocket for chat stream
* HTML5 video/audio embed

---

## 2.2 UI Layout

Single screen:

```text id="ui_1"
------------------------------------
| Chat / Terminal                 |
|                                |
|                                |
|                                |
|--------------------------------|
| Media Panel (optional)         |
|--------------------------------|
| Input line                     |
------------------------------------
```

---

## 2.3 Components

### Chat Window

* streaming messages
* agent + user messages
* markdown-lite support

---

### Media Panel

* supports:

  * YouTube embed OR direct URL
  * play/pause
  * timestamp tracking (optional MVP-light)

---

### Input System

* text input
* ENTER → send message
* Ctrl+Space → Radar capture

---

## 2.4 Radar Capture (Frontend)

On Ctrl+Space:

Frontend sends:

```json id="radar_event"
POST /radar
{
  session_id,
  selected_word OR cursor_word,
  context_line,
  media_timestamp
}
```

No UI feedback required (optional tiny “saved” indicator).

---

# 3. Backend Spec

## 3.1 Tech Stack

* FastAPI (Python) OR Node.js (Express)
* WebSocket for chat streaming
* SQLite (MVP) or Postgres

---

## 3.2 Core APIs

---

### POST /chat

Input:

```json id="chat_req"
{
  session_id,
  message
}
```

Output:

```json id="chat_res"
{
  response_stream
}
```

---

### POST /radar

Stores captured word:

```json id="radar_req"
{
  session_id,
  word,
  context,
  timestamp,
  media_position
}
```

---

### GET /session/:id/radar

Returns all captured words.

---

### POST /endgame/start

Triggers Endgame session.

Returns:

```json id="endgame_1"
{
  words[],
  contexts_optional (hidden initially)
}
```

---

### POST /endgame/guess

```json id="endgame_guess"
{
  word_id,
  user_guess
}
```

Returns:

* correctness evaluation
* optional context reveal

---

# 4. Data Model

## 4.0 User Profile

```sql id="db_user_profile"
UserProfile(
  id TEXT PRIMARY KEY,
  l1 TEXT,                  -- strong language
  l2 TEXT,                  -- target language
  proficiency TEXT,         -- novice | intermediate | advanced | fluent
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

Proficiency affects AI response behavior:

| Level         | AI Behavior                                      |
| ------------- | ------------------------------------------------ |
| novice        | Simple sentences, common words, short responses  |
| intermediate  | Natural flow, some idioms, medium responses       |
| advanced      | Full range, technical terms, longer responses     |
| fluent        | Native-like, slang, nuance, no simplification    |

Can be set manually or auto-adjusted over time based on user interaction patterns.

---

## 4.1 Session

```sql id="db_session"
Session(
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP,
  l1 TEXT,           -- strong language (e.g. "en")
  l2 TEXT,           -- target language (e.g. "de")
  ramp_ratio FLOAT,  -- current L2 ratio 0.0-1.0
  ramp_mode TEXT     -- auto | manual
)
```

---

## 4.2 Message (optional MVP logging)

```sql id="db_msg"
Message(
  id,
  session_id,
  role, -- user | assistant
  content,
  timestamp
)
```

---

## 4.3 Radar Item

```sql id="db_radar"
RadarItem(
  id,
  session_id,
  word,
  context_text,
  media_timestamp,
  ramp_ratio,     -- L2 ratio at time of capture
  created_at
)
```

---

# 5. AI Agent Spec

## 5.1 System Role Prompt

Agent must behave as:

* conversational friend
* technical peer
* light language guide

NOT:

* teacher
* quiz engine
* grammar examiner

---

## 5.2 Response Rules

### MUST:

* keep conversation natural
* ask clarifying questions
* maintain context continuity

### MAY:

* lightly rephrase user sentences
* gently suggest better phrasing (rare)
* reference media content

### MUST NOT:

* interrupt with exercises
* trigger quizzes in chat
* over-explain grammar
* force corrections

---

# 6. Language Ramp

## 6.1 Purpose

Allow users to start in their strong language and gradually shift to the target language. Removes the cold-start problem of being dropped into an unfamiliar language.

---

## 6.2 Configuration

On session start, user sets:

```json id="ramp_config"
{
  "l1": "en",          // strong language
  "l2": "de",          // target language
  "start_ratio": 0.1,  // % of L2 in AI responses at session start (0 = pure L1, 1 = pure L2)
  "ramp_mode": "auto"  // auto | manual
}
```

---

## 6.3 Shift Mechanics

### Auto mode (default)

AI gradually increases L2 ratio based on:

| Signal                        | Effect                    |
| ----------------------------- | ------------------------- |
| user responds in L2           | increase ratio            |
| user responds in L1           | hold or slow down         |
| radar captures increase       | user is noticing → hold   |
| long silence after L2 stretch | back off slightly         |
| session number (across sessions) | gradual baseline increase |

### Manual mode

User adjusts ratio explicitly (e.g. `/lang 50` to set 50% L2).

---

## 6.4 Mixing Rules (Formal)

The AI constructs every response based on two variables:
- **R** = current ramp ratio (0.0–1.0)
- **P** = user proficiency (novice / intermediate / advanced / fluent)

### 6.4.1 Ratio Bands

| Band | Ratio R     | Sentence Structure              | Example (EN→DE, P=novice)                                          |
| ---- | ----------- | ------------------------------- | ------------------------------------------------------------------- |
| A    | 0.0 – 0.2   | L1 sentence + 1-2 L2 words      | "That sounds **wirklich frustrierend**. How do you handle that?"    |
| B    | 0.2 – 0.4   | L1 sentence + L2 clause         | "**Das verstehe ich** — I get it. **Aber** what would you change?"  |
| C    | 0.4 – 0.6   | Mixed: L2 sentence + L1 fallback | "**Du verdienst einen besseren Prozess.** You deserve a better one." |
| D    | 0.6 – 0.8   | L2 sentence + L1 words          | "**Wie war dein Tag?** I mean, **wie läuft es** at work?"          |
| E    | 0.8 – 1.0   | Full L2                         | "**Wie war dein Tag? Erzähl mal, was bei der Arbeit passiert ist.**" |

### 6.4.2 Proficiency Modifiers

Proficiency adjusts **word complexity** within each band:

| Proficiency   | Vocabulary Choice        | Sentence Length | Idioms/Slang |
| ------------- | ------------------------ | --------------- | ------------ |
| novice        | Top 1000 L2 words        | Short (5-10 w)  | None         |
| intermediate  | Top 3000 L2 words        | Medium (8-15 w) | Rare         |
| advanced      | Full vocabulary          | Natural length  | Occasional   |
| fluent        | Unrestricted             | Natural length  | Full range   |

### 6.4.3 Contextual Embedding Rules

When the AI introduces an L2 word into an L1 sentence (Band A-B):

1. **The L2 word must be guessable from surrounding L1 context.**
   - ✓ "...your manager should give you **klare Anforderungen** — clear requirements."
   - ✗ "...your manager should give you **klare Anforderungen**." (no clue)

2. **Parenthetical translation is the fallback**, used once per word:
   - First appearance: L2 word + brief L1 gloss in same sentence
   - Subsequent appearances: L2 word only (no gloss)

3. **Grammar stays natural.** Don't break sentence structure to insert L2:
   - ✓ "That is **wirklich** frustrating."
   - ✗ "That is **wirklich frustrierend** und I understand das." (word salad)

4. **Emotional content stays in L1.** Never insert L2 into emotionally charged moments:
   - If user is venting/angry/upset → keep response in L1, add at most 1 L2 word
   - If user is calm/casual → normal mixing

### 6.4.4 Ramp Progression Signals

The ratio shifts within a session based on:

```text id="ramp_signals"
user writes in L2          → R += 0.02
user writes in L1          → R -= 0.01
user ignores L2 word       → R -= 0.01
user uses L2 word back     → R += 0.03
user asks "what does X mean" → R -= 0.02 (struggling)
5 messages without L2 shift → R += 0.01 (comfortable)
```

### 6.4.5 Cross-Session Persistence

At session end:
- Store final `ramp_ratio` in session
- Next session starts at: `max(0.1, previous_ratio - 0.05)`
  - Slight regression so user isn't dropped into deep L2 cold
- After 5+ sessions, baseline floor rises: `max(0.2, 0.1 + sessions * 0.02)`

---

## 6.5 Radar + Ramp Interaction

* Radar captures in L2 are tagged with `ramp_ratio` at time of capture
* Endgame can prioritize words captured at lower ratios (harder to learn)
* Session summary shows: words captured, ratio progression, L2 exposure time

---

## 7. Endgame Spec (Game Mode)

## 6.1 Flow

### Step 1: word list

User sees:

```
Captured Words:
1. mitigation
2. brittle
3. rollback
```

---

### Step 2: guess phase

User inputs meaning guesses.

---

### Step 3: context reveal (optional per word)

Show:

* original sentence
* surrounding chat/media line

---

### Step 4: answer reveal

Show:

* definition
* short explanation
* optional example

---

### Step 5: completion

Store:

* guessed_correct / incorrect
* confidence score (optional)

---

# 7. Implementation Phases

---

## Phase 1 — Minimal Chat + Radar (Week 1)

### Build:

* web TUI chat UI
* backend chat endpoint
* Ctrl+Space radar capture
* store in DB

### Output:

* user can chat
* user can capture words

---

## Phase 2 — Endgame Game (Week 2)

### Build:

* end session button
* radar fetch API
* guessing UI
* context reveal

### Output:

* full learning loop exists

---

## Phase 3 — Media Integration (Week 3)

### Build:

* video/audio embed
* timestamp tracking (basic)
* attach media context to radar

---

## Phase 4 — Polish (optional)

* streaming chat
* better terminal UI
* persistence improvements
* UX refinements

---

# 8. Testing Plan

---

## 8.1 Unit Tests

Backend:

* radar store correctness
* session retrieval
* endgame word fetch
* guess evaluation

---

## 8.2 Integration Tests

* chat → radar → endgame loop works end-to-end
* media context attaches correctly
* session persistence works

---

## 8.3 UI Tests

* Ctrl+Space works reliably
* no blocking UI freeze
* chat streaming stable

---

## 8.4 Manual Tests (critical for MVP)

Check:

* does conversation feel natural?
* do users actually press Ctrl+Space?
* is endgame engaging without being confusing?
* does media feel integrated or separate?

---

# 9. Acceptance Criteria (MVP DONE WHEN)

System is valid if ALL are true:

## 9.1 Core Loop

* user can have continuous conversation with AI
* user can mark words with Ctrl+Space
* words are stored with context

---

## 9.2 Endgame Works

* system lists captured words
* user can guess meanings
* system reveals context + correct meaning

---

## 9.3 Media (basic)

* at least one media source can be displayed
* radar captures can reference media context

---

## 9.4 Stability

* no crashes during 30+ min session
* radar capture does not interrupt chat
* chat latency is acceptable (<2–3s response start)

---

## 10. Non-Goals (explicitly excluded)

* no spaced repetition system
* no dashboards
* no gamification (XP, streaks)
* no adaptive correction engine
* no emotion analysis
* no vocabulary graphs (yet)
* no mobile app

---

# One-line summary

> A web-based conversational terminal where users capture interesting language during flow and later reconstruct meaning in a dedicated recall game.

---

If you want next step, I can turn this into:

* a **folder structure + repo scaffold**
* or **actual API code skeleton (FastAPI + React)**
* or a **1-week build checklist with tasks per day**

