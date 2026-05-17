Below is your **updated MVP Engineering Spec (v1.1)** with the **right-side Radar word collection integrated cleanly** and all previous ambiguity tightened.

---

# Traceback MVP — Engineering Spec (v1.1)

---

# 0. Goal (unchanged, refined)

Build a **web-based conversational terminal** where users:

* talk with an AI agent in target language
* optionally consume media in-session
* capture interesting words via Ctrl+Space (Radar)
* see captured words accumulate in a **right-side live collection**
* replay them later in an Endgame reconstruction game

---

# 1. System Architecture

```text id="arch_v11"
[ Web Frontend (Dual-pane TUI) ]
        |
        | WebSocket / REST
        |
[ Backend API (FastAPI / Node) ]
        |
        | LLM API
        |
[ DB (SQLite/Postgres) ]
```

---

# 2. Frontend Spec (Critical Update)

## 2.1 Tech Stack

* React (recommended)
* xterm.js OR custom monospace layout
* WebSocket for chat streaming
* HTML5 media embed

---

## 2.2 Layout (NEW — Dual Pane Core)

```text id="ui_v11"
------------------------------------------------------
| CHAT / MEDIA (Main Flow)     | RADAR WORD PANEL   |
|                              |--------------------|
| conversation stream          | mitigation   (3)   |
| media inline (optional)      | brittle      (1)   |
| AI responses                | rollback     (2)   |
| user input                  | latency      (1)   |
|                              |                    |
------------------------------------------------------
| input line                                        |
------------------------------------------------------
```

---

## 2.3 Component Breakdown

### A. Chat / Media Pane (LEFT)

* conversation stream
* AI responses
* optional embedded media player
* continuous scroll terminal style

---

### B. Radar Word Panel (RIGHT) — NEW CORE FEATURE

Displays live captured vocabulary:

```text id="radar_panel"
WordItem {
  word
  frequency_count
  last_seen_context_snippet
  status: new | repeated | faded
}
```

### Rules:

* words appear immediately on Ctrl+Space
* no interruption to chat
* duplicates increment count
* most recent words at top

---

### C. Input Line

* text input
* ENTER → send message
* Ctrl+Space → capture word (Radar event)

---

# 3. Radar Capture System (Updated)

## 3.1 Trigger

```text id="radar_trigger_v11"
Ctrl + Space
```

---

## 3.2 Capture Behavior

Frontend sends:

```json id="radar_event_v11"
POST /radar
{
  session_id,
  word_or_phrase,
  context_snippet,
  media_timestamp (optional)
}
```

---

## 3.3 Frontend Immediate Update (IMPORTANT CHANGE)

Upon capture:

### UI updates instantly:

* add/update word in right panel
* increment frequency
* optionally highlight new entry briefly

### NO:

* no popup
* no modal
* no pause
* no explanation

---

## 3.4 Backend Behavior

Backend:

* stores RadarItem
* updates session state
* returns success (no processing delay required)

---

# 4. Radar Panel Behavior Rules

## 4.1 Insertion logic

* new word → top of list
* existing word → increment counter + bump to top

---

## 4.2 Visual state (lightweight)

| State    | Behavior                 |
| -------- | ------------------------ |
| new      | bright highlight (brief) |
| repeated | normal + count           |
| old      | faded                    |

---

## 4.3 Optional interaction (NOT required for MVP)

Click word:

* show context snippet
* show occurrences in session

---

# 5. Agent (AI Role Spec — unchanged but clarified)

## Role definition:

AI is:

* conversational friend
* technical peer
* lightweight language stabilizer

NOT:

* teacher
* quiz engine
* grammar evaluator

---

## Response rules:

### MUST:

* maintain conversational flow
* adapt to user topic
* respond naturally in target language

### MAY:

* lightly rephrase user sentence
* clarify ambiguity
* reference media context

### MUST NOT:

* interrupt with exercises
* trigger learning tasks during conversation
* explain vocabulary unless asked

---

# 6. Media System (unchanged but integrated context)

## Media is optional overlay inside chat flow

### Features:

* embed video/audio URL
* track playback state (optional MVP-lite)
* provide context to AI prompt

### Media is NOT a mode

It is just part of context state.

---

# 7. Endgame (Reconstruction Game)

## 7.1 Trigger

* user clicks “End Session”
* or “Play Game”

---

## 7.2 Input

System fetches:

```text id="endgame_input"
RadarWordList + context snippets
```

---

## 7.3 Flow

### Step 1 — Word list

```text id="eg_1"
Captured Words:

1. mitigation (3)
2. brittle (1)
3. rollback (2)
```

---

### Step 2 — Guess phase

User enters meanings.

---

### Step 3 — Context reveal (on demand)

* show original sentence
* show chat/media snippet

---

### Step 4 — Answer reveal

* definition
* short explanation
* optional example

---

### Step 5 — Completion storage

Update:

* word familiarity
* optional confidence marker

---

# 8. Backend Spec (unchanged, but simplified integration)

## APIs

### POST /chat

### POST /radar

### GET /session/:id/radar

### POST /endgame/start

### POST /endgame/guess

No changes required for Radar panel (frontend-only feature).

---

# 9. Data Model (updated only for clarity)

## Radar Item

```sql id="db_radar_v11"
RadarItem(
  id,
  session_id,
  word,
  context_text,
  media_timestamp,
  created_at,
  frequency_count
)
```

---

## Session

```sql id="db_session_v11"
Session(
  id,
  created_at
)
```

---

# 10. Implementation Phases (UPDATED)

---

## Phase 1 — Core Dual Pane MVP

### Build:

* chat terminal (left)
* radar panel (right)
* Ctrl+Space capture
* backend storage

### Output:

✔ live word accumulation works
✔ chat works
✔ no interruptions

---

## Phase 2 — Endgame Game

* word listing
* guessing flow
* context reveal

---

## Phase 3 — Media Integration

* embed video/audio
* attach context to radar

---

# 11. Testing Plan (UPDATED)

## Functional tests

* Ctrl+Space adds word instantly to right panel
* duplicate word increments count
* chat is not interrupted
* endgame loads all radar words correctly

---

## UX tests

* does radar panel feel “natural” not distracting?
* do users keep noticing words?
* does endgame feel like recall game not exam?

---

# 12. Acceptance Criteria (FINAL MVP DEFINITION)

System is complete when:

## Core loop works:

* user chats naturally
* user captures words via Ctrl+Space
* words appear live in right panel

---

## Endgame works:

* session produces word list
* user can guess meanings
* system reveals context + correct meaning

---

## Stability:

* no UI blocking during radar capture
* no lag in chat flow
* system runs ≥30 min session without failure

---

# 13. Non-Goals (STRICT)

Do NOT implement in MVP:

* spaced repetition algorithms
* vocabulary graphs
* emotion analysis
* adaptive correction systems
* gamification (XP/streaks)
* multi-user systems
* mobile apps
* complex personalization

---

# One-line MVP Definition (UPDATED)

> A dual-pane conversational terminal where users capture interesting words during natural interaction and later reconstruct their meanings in a dedicated recall game.

---

