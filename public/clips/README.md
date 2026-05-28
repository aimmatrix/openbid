# Demo clips

These three files back the Video Stage.

| File | Scene | Status |
|---|---|---|
| `kitchen-morning.mp4` | `scene_kitchen_morning` | **Real AI footage** — Sora-2 generated (woman making coffee, sunrise kitchen) |
| `park-afternoon.mp4` | `scene_park_afternoon` | **Real AI footage** — Sora-2 generated (adults in a summer park) |
| `tier2-fallback.mp4` | Tier-2 fallback | **Real AI footage** — Sora-2 generated (premium coffee ad) |

## Note on the park scene

Sora (and every major model) refuses to generate footage containing minors, so
the park clip shows **adults only**. The block narrative still works: the
`minor_present` flag drives the oversight gate and shows as an amber badge in the
UI — i.e. the platform's vision layer flagged a minor even though the advertiser
agent only saw "outdoor leisure." If you want a child actually visible on screen,
swap in real recorded/stock footage (same filename, no code change).

## Swapping in real footage

Drop a `.mp4` with the **same filename** here — no code changes. Filenames must
match `clip_url` in `mocks/scenes.ts`. Keep them short (5–10s), 16:9, H.264.

## Regenerating

```bash
# AI footage via OpenAI Sora (needs OPENAI_API_KEY with Sora access + credits):
#   1. create a job:
curl -s -X POST https://api.openai.com/v1/videos \
  -H "Authorization: Bearer $OPENAI_API_KEY" -H "Content-Type: application/json" \
  -d '{"model":"sora-2","prompt":"<scene>","seconds":"8","size":"1280x720"}'
#   2. poll + download (paste the returned id):
bash scripts/sora-fetch.sh <video_id> kitchen-morning.mp4

# Abstract gradient placeholders (needs ffmpeg, no API):
bash scripts/generate-placeholder-clips.sh
```
