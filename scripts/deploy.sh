#!/bin/bash
set -e

COMPANION_DIR="$HOME/companion"
LOGDIR="/tmp/traceback-deploy"
mkdir -p "$LOGDIR"

cd "$COMPANION_DIR"

BEFORE=$(git rev-parse HEAD)
git pull >> "$LOGDIR/pull.log" 2>&1
AFTER=$(git rev-parse HEAD)

if [ "$BEFORE" = "$AFTER" ]; then
  echo "$(date) — no new commits" >> "$LOGDIR/pull.log"
  exit 0
fi

# Per-commit log
LOG="$LOGDIR/${AFTER}.log"
mkdir -p "$LOGDIR"
echo "$(date) — deploy started for $AFTER" > "$LOG"

# Rebuild frontend
echo "$(date) — rebuilding frontend" >> "$LOG"
cd src/frontend
REACT_APP_API_URL= npx react-scripts build >> "$LOG" 2>&1
cd "$COMPANION_DIR"

# Restart backend
echo "$(date) — restarting backend" >> "$LOG"
kill $(lsof -ti:4001) 2>/dev/null || true
sleep 1
cd "$COMPANION_DIR/src/backend"
PORT=4001 nohup node server.js > "$LOGDIR/backend.log" 2>&1 &

echo "$(date) — deploy done" >> "$LOG"

# Symlink latest
ln -sf "$LOG" "$LOGDIR/latest.log"
