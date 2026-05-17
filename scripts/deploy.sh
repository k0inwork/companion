#!/bin/bash
set -e

COMpanion_DIR="$HOME/companion"
LOG="/tmp/traceback-deploy.log"

echo "$(date) — deploy started" >> "$LOG"
cd "$COMPANION_DIR"

# Pull latest
git pull >> "$LOG" 2>&1

# Rebuild frontend
cd src/frontend
REACT_APP_API_URL= npx react-scripts build >> "$LOG" 2>&1

# Restart backend
kill $(lsof -ti:4001) 2>/dev/null || true
sleep 1
cd "$COMPANION_DIR/src/backend"
PORT=4001 nohup node server.js > /tmp/tb.log 2>&1 &

echo "$(date) — deploy done" >> "$LOG"
