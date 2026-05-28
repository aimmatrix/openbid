#!/usr/bin/env bash
# Poll a Sora video job until done and download it to public/clips/<name>.
# Usage: scripts/sora-fetch.sh <video_id> <output_name.mp4>
set -euo pipefail
cd "$(dirname "$0")/.."
OKEY=$(grep '^OPENAI_API_KEY=' .env.local | cut -d= -f2)
ID="$1"; OUT="public/clips/$2"

for i in $(seq 1 80); do
  resp=$(curl -s "https://api.openai.com/v1/videos/$ID" -H "Authorization: Bearer $OKEY")
  status=$(echo "$resp" | python3 -c "import sys,json;print(json.load(sys.stdin).get('status'))")
  prog=$(echo "$resp" | python3 -c "import sys,json;print(json.load(sys.stdin).get('progress'))")
  echo "[poll $i] status=$status progress=$prog%"
  case "$status" in
    completed)
      curl -s "https://api.openai.com/v1/videos/$ID/content" -H "Authorization: Bearer $OKEY" -o "$OUT"
      echo "downloaded -> $OUT ($(du -h "$OUT" | cut -f1))"
      exit 0 ;;
    failed)
      echo "FAILED: $resp"; exit 1 ;;
  esac
  sleep 10
done
echo "timed out"; exit 1
