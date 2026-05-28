#!/usr/bin/env bash
# Generate themed PLACEHOLDER demo clips for OpenBid's video stage.
# These are abstract animated gradients (no text — this ffmpeg build lacks
# drawtext). Swap them for REAL footage before the judged demo; the park clip
# especially should show a child, for the safety-block narrative.
# See public/clips/README.md. Requires ffmpeg (brew install ffmpeg).
set -euo pipefail
cd "$(dirname "$0")/.."

OUT="public/clips"
mkdir -p "$OUT"

gen() { # name duration c0 c1 c2
  local name="$1" dur="$2" c0="$3" c1="$4" c2="$5"
  ffmpeg -y -loglevel error \
    -f lavfi -i "gradients=s=1280x720:c0=${c0}:c1=${c1}:c2=${c2}:nb_colors=3:speed=0.012:r=24" \
    -t "$dur" -pix_fmt yuv420p -movflags +faststart -an "$OUT/$name"
  echo "  -> $OUT/$name ($(du -h "$OUT/$name" | cut -f1))"
}

echo "Generating placeholder clips..."
gen "kitchen-morning.mp4" 8 "0x5a3d1a" "0x2a1d0a" "0x140d04"  # warm amber
gen "park-afternoon.mp4"  9 "0x1a5536" "0x0d2a1a" "0x06121f"  # green/teal
gen "tier2-fallback.mp4"  5 "0x1f3a6e" "0x12244a" "0x0a0a0b"  # cool blue
echo "Done."
