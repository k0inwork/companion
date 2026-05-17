CREATE TABLE IF NOT EXISTS guide_translation (
  lang VARCHAR(5) NOT NULL,
  step_key VARCHAR(50) NOT NULL,
  text TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (lang, step_key)
);
