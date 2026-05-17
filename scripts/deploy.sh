#!/bin/bash
set -e

COMPANION_DIR="$HOME/companion"
LOG="/tmp/traceback-deploy.log"

echo "$(date) — deploy started" >> "$LOG"
cd "$COMPANION_DIR"

BEFORE=$(git rev-parse HEAD)
git pull >> "$LOG" 2>&1
AFTER=$(git rev-parse HEAD)

if [ "$BEFORE" = "$AFTER" ]; then
  echo "$(date) — no new commits" >> "$LOG"
  exit 0
fi

# Only rebuild frontend if frontend src changed
if git diff --name-only "$BEFORE" "$AFTER" | grep -q "^src/frontend/"; then
  echo "$(date) — rebuilding frontend" >> "$LOG"
  cd src/frontend
  REACT_APP_API_URL= npx react-scripts build >> "$LOG" 2>&1
  cd "$COMPANION_DIR"
fi

# Restart backend if backend or frontend changed
if git diff --name-only "$BEFORE" "$AFTER" | grep -qE "^src/(backend|frontend)/"; then
  echo "$(date) — restarting backend" >> "$LOG"
  kill $(lsof -ti:4001) 2>/dev/null || true
  sleep 1
  cd "$COMPANION_DIR/src/backend"
  PORT=4001 nohup node server.js > /tmp/tb.log 2>&1 &
fi

echo "$(date) — deploy done" >> "$LOG"
