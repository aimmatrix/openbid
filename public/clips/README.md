# Demo clips

These files back the Video Stage. All are real **Sora-2** generated footage.

| File | Used for | Content |
|---|---|---|
| `kitchen-morning.mp4` | `scene_kitchen_morning` | woman making coffee, sunrise kitchen |
| `park-afternoon.mp4` | `scene_park_afternoon` | adults in a summer park |
| `tier2-fallback.mp4` | Tier-2 ad — coffee / default winner | premium coffee ad |
| `tier2-apparel.mp4` | Tier-2 ad — apparel winner | premium apparel ad |

## Tier-2 clip selection

The "Generate AI clip (Tier 2)" button serves a **pre-baked** clip chosen by the
winning brand (`lib/adapters/render-video.ts` → `fallbackClipFor`): apparel /
fashion winners get `tier2-apparel.mp4`, everything else gets
`tier2-fallback.mp4`. So Tier-2 is coherent on both the kitchen (coffee) and the
park (apparel or coffee) paths. It does **not** generate live — it's instant,
reliable playback (live Sora gen takes ~2 min).

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
