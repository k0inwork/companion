-- Traceback initial schema
-- Auto-run on server startup (idempotent)

CREATE TABLE IF NOT EXISTS user_profile (
  id          TEXT PRIMARY KEY,
  l1          TEXT NOT NULL DEFAULT 'en',
  l2          TEXT NOT NULL DEFAULT 'de',
  proficiency TEXT NOT NULL DEFAULT 'novice'
              CHECK (proficiency IN ('novice','intermediate','advanced','fluent')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES user_profile(id),
  l1          TEXT NOT NULL DEFAULT 'en',
  l2          TEXT NOT NULL DEFAULT 'de',
  ramp_ratio  DOUBLE PRECISION NOT NULL DEFAULT 0.1,
  ramp_mode   TEXT NOT NULL DEFAULT 'auto'
              CHECK (ramp_mode IN ('auto','manual')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message (
  id          SERIAL PRIMARY KEY,
  session_id  TEXT NOT NULL REFERENCES session(id),
  role        TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content     TEXT NOT NULL,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS radar_item (
  id              SERIAL PRIMARY KEY,
  session_id      TEXT NOT NULL REFERENCES session(id),
  word            TEXT NOT NULL,
  context_text    TEXT,
  media_timestamp DOUBLE PRECISION,
  ramp_ratio      DOUBLE PRECISION,
  frequency_count INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, word)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_message_session ON message (session_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_radar_session ON radar_item (session_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_user   ON session (user_id, created_at DESC);
