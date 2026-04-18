#!/bin/zsh

set -euo pipefail

SCRIPT_DIR="${0:A:h}"
HOST="127.0.0.1"
PORT="3000"
APP_URL="http://${HOST}:${PORT}/"

cd "$SCRIPT_DIR"

if [ ! -d node_modules ]; then
  echo "Installing dependencies before launch..."
  npm install
fi

if lsof -n -P -i "tcp:${PORT}" >/dev/null 2>&1; then
  echo "Port ${PORT} is already in use."
  echo "If Speed Reader is already running, open ${APP_URL}"
  echo "Otherwise stop the process using that port and launch again."
  exit 0
fi

echo "Launching Speed Reader at ${APP_URL}"
echo "Keep this Terminal window open while you use the app."

npm run dev -- --host "$HOST" --port "$PORT"
