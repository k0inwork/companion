-- Session tokens for API auth
CREATE TABLE IF NOT EXISTS session_token (
  token       TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES user_profile(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_last_used ON session_token (last_used DESC);
