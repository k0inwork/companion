# Requirements Document

# Traceback — Autonomous Language Acquisition Environment

## 1. Vision

Traditional language-learning systems optimize for correctness, memorization, and curriculum progression.
Traceback instead optimizes for:

* semantic recovery
* cognitive flow
* emotional salience
* identity-relevant communication
* gradual probabilistic acquisition

The system is an AI-assisted conversational environment designed for professionals, technical users, and intellectually driven learners who want to *think* in another language rather than merely translate into it.

The platform focuses on:

* real-world cognition,
* emotionally relevant communication,
* contextual language acquisition,
* and low-friction interaction loops.

---

# 2. Core Thesis

Language acquisition accelerates when learners:

* encounter personally meaningful language,
* notice unknown semantic signals naturally,
* delay immediate translation,
* reconstruct meaning from repeated contextual exposure,
* and communicate under authentic cognitive pressure.

Traceback therefore prioritizes:

* noticing over memorization,
* reconstruction over translation,
* recoverability over correctness,
* and continuity over lessons.

---

# 3. Primary Audience

## Technical Professionals

* software engineers
* DevOps engineers
* architects
* researchers
* startup founders
* data scientists

## Secondary Audience

* advanced adult learners
* immigrants
* remote workers
* multilingual professionals
* intellectually curious users

---

# 4. Core Product Principles

| Principle           | Description                                              |
| ------------------- | -------------------------------------------------------- |
| Flow Preservation   | Never interrupt cognition unnecessarily                  |
| Intent First        | Preserve intended meaning before correcting grammar      |
| Delayed Resolution  | Avoid instant translation whenever possible              |
| Semantic Recovery   | Train contextual inference abilities                     |
| Identity Relevance  | Use topics emotionally/professionally meaningful to user |
| Low Friction        | Interaction must remain lightweight and keyboard-centric |
| Gradual Acquisition | Vocabulary emerges probabilistically over time           |

---

# 5. Product Architecture

The system consists of four major subsystems:

1. Conversational Core
2. Semantic Radar
3. Contextual Intelligence Layer
4. Retention & Reconstruction Engine

---

# 6. Conversational Core

## 6.1 Purpose

Provide a psychologically low-friction environment for:

* free-form conversation,
* emotional venting,
* technical discussion,
* and exploratory thinking in the target language.

The system should feel closer to:

* a cognitive workspace,
  than:
* a lesson platform.

---

## 6.2 Functional Requirements

### FR-C1: Freeform Conversation

The user may:

* type,
* speak,
* paste content,
* or mix languages freely.

The system must preserve conversational momentum even under:

* broken grammar,
* fragmented syntax,
* code-switching,
* or incomplete vocabulary.

---

### FR-C2: Intent Reconstruction

The assistant must prioritize:

1. understanding intended meaning,
2. preserving emotional tone,
3. maintaining flow,
   before:
4. grammatical correction.

---

### FR-C3: Adaptive Correction

Correction intensity must vary dynamically.

| Context                | Behavior                        |
| ---------------------- | ------------------------------- |
| Emotional venting      | Minimal interruption            |
| Technical reasoning    | Correct only critical ambiguity |
| Explicit practice mode | Detailed corrections            |
| High fluency flow      | Passive correction logging      |

---

### FR-C4: Session Continuity

The system maintains:

* topic continuity,
* vocabulary recurrence,
* emotional context,
* and professional domains across sessions.

---

# 7. Semantic Radar System

## 7.1 Purpose

Train natural noticing and contextual acquisition through low-friction lexical marking.

---

## 7.2 Core Interaction

During:

* conversation,
* media playback,
* article reading,
* or listening sessions,

the user can press:

```text id="d4v8of"
Ctrl+Space
```

to mark:

* an unknown,
* interesting,
* emotionally charged,
* or recurring word/phrase.

The interaction must complete instantly without interrupting flow.

---

## 7.3 Radar Capture Requirements

Each marked signal stores:

| Data              | Description                    |
| ----------------- | ------------------------------ |
| Word/Phrase       | Raw captured lexical unit      |
| Timestamp         | Time in session/media          |
| Source Context    | Sentence or transcript segment |
| Topic Context     | Current semantic territory     |
| Emotional Context | Stress/calm/interest markers   |
| Modality          | Audio/text/video/conversation  |

---

## 7.4 Delayed Resolution Principle

The system should NOT immediately reveal:

* translation,
* dictionary definition,
* or grammatical breakdown by default.

Instead:

* ambiguity remains temporarily unresolved.

This creates semantic anticipation and contextual accumulation.

---

# 8. Traceback Engine (Retention System)

## 8.1 Purpose

Transform naturally noticed lexical signals into long-term semantic acquisition.

---

## 8.2 Traceback Session

At the end of a session, the system generates a lightweight reconstruction experience.

The user attempts to infer meanings from:

* memory,
* emotional context,
* repeated exposure,
* and contextual hints.

---

## 8.3 Reconstruction Flow

### Stage 1 — Raw Recall

User attempts to remember:

* where the word appeared,
* tone,
* topic,
* probable meaning.

No hints provided.

---

### Stage 2 — Context Recovery

The system provides:

* original sentence,
* transcript fragment,
* or conversation excerpt.

---

### Stage 3 — Alternate Exposure

The system provides:

* a second contextual usage,
* ideally from another source or conversation.

---

### Stage 4 — Semantic Neighborhood

Optional hints:

* synonym cluster,
* emotional tone,
* conceptual neighbors,
* topic association.

---

### Stage 5 — Resolution

The system reveals:

* translation,
* definition,
* pronunciation,
* and native usage patterns.

---

# 9. Contextual Intelligence Layer

## 9.1 Purpose

Continuously model the user’s evolving semantic environment.

---

## 9.2 Ontological Tracking

The system tracks:

* recurring domains,
* technical topics,
* emotional territories,
* recurring entities,
* vocabulary emergence patterns.

Examples:

* distributed systems
* burnout
* Kubernetes
* immigration
* observability
* finance
* startup operations

---

## 9.3 Context-Seeding

The ontology is used to improve:

| System               | Improvement                       |
| -------------------- | --------------------------------- |
| STT                  | Better technical term recognition |
| RAG                  | More relevant retrieval           |
| Conversation         | Better continuity                 |
| Vocabulary Surfacing | More meaningful recurrence        |
| Reconstruction       | Stronger contextual hints         |

---

# 10. Media & Input System

## 10.1 Supported Modalities

The system supports:

* text chat,
* voice conversation,
* article ingestion,
* podcast/video transcription,
* clipboard ingestion.

---

## 10.2 Context-Seeded STT

Speech recognition should dynamically receive:

* current topic clusters,
* active entities,
* recent vocabulary,
* and professional jargon.

Goal:
improve recognition accuracy for:

* accented speech,
* technical terminology,
* mixed-language speech.

---

# 11. RAG Knowledge System

## 11.1 Purpose

Provide real-world language exposure aligned with the user’s semantic interests.

---

## 11.2 Retrieval Sources

Potential sources:

* technical blogs
* news articles
* documentation
* forums
* transcripts
* podcasts
* YouTube subtitles

---

## 11.3 Retrieval Constraints

Retrieved content should:

* align with current interests,
* match target fluency level,
* preserve authentic native phrasing,
* avoid excessive simplification.

---

# 12. User Interface Philosophy

## 12.1 TUI-First Design

Primary interface:

* keyboard-driven,
* high-contrast,
* monospace-oriented,
* distraction-minimized.

Inspired by:

* terminal workflows,
* editors,
* REPL environments.

---

## 12.2 Flow Constraints

The UI must:

* minimize popups,
* minimize modal interruptions,
* avoid gamified clutter,
* preserve cognitive continuity.

---

# 13. Technical Architecture

## 13.1 Suggested Stack

| Layer          | Suggested Tech                 |
| -------------- | ------------------------------ |
| TUI            | Python Textual                 |
| Backend        | Python/FastAPI                 |
| Vector Store   | Qdrant / Pinecone              |
| STT            | Faster-Whisper                 |
| LLM            | GPT-4o / Claude / local models |
| Embeddings     | bge-large / OpenAI embeddings  |
| Media Pipeline | ffmpeg                         |
| Event Bus      | Redis Streams / NATS           |

---

# 14. Local-First Deployment

The system should support:

* offline-first workflows,
* self-hosted inference,
* local vector stores,
* local STT,
* and privacy-preserving deployment.

---

# 15. MVP Scope

## Included

* TUI shell
* voice/text hybrid interaction
* Semantic Radar
* Traceback reconstruction
* session memory
* adaptive correction
* context-seeded STT

## Excluded

* mobile apps
* social features
* multiplayer
* avatar systems
* complex gamification
* enterprise dashboards

---

# 16. Success Metrics

| Metric                  | Goal                                   |
| ----------------------- | -------------------------------------- |
| Daily Active Use        | Sustained long-form sessions           |
| Radar Usage             | Frequent spontaneous lexical capture   |
| Reconstruction Accuracy | Improved contextual inference          |
| Retention               | Reappearance recognition rate          |
| Flow Duration           | Long uninterrupted interaction windows |
| User Sentiment          | Reduced speaking anxiety               |

---

# 17. Long-Term Vision

Traceback evolves from:

* a language-learning assistant

into:

* a persistent cognitive companion for multilingual thought.

The ultimate goal is not:
“knowing a language.”

The goal is:

* operating intellectually,
* emotionally,
* and professionally,
  inside another linguistic reality.

