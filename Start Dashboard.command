#!/bin/bash
# Double-click this file to start the Promo Profit Finder dashboard.
# It starts the local server and opens your browser automatically.

cd "$(dirname "$0")"

echo "Starting Promo Profit Finder..."
echo "(Leave this window open while you use the dashboard. Close it to stop.)"
echo

( sleep 1.5 && open "http://127.0.0.1:8000" ) &

python3 -m uvicorn server:app --host 127.0.0.1 --port 8000
