// mcp/src/openbid/scenes.ts
// Sample scenes. scene_park_afternoon carries the minor_present flag — the
// safety gate fires when North Lager (alcohol) wins this scene.

import type { Scene } from "./types.js";

export const scenes: Scene[] = [
  {
    scene_id: "scene_kitchen_morning",
    clip_url: "/clips/kitchen-morning.mp4",
    duration: 8.0,
    context:
      "A warm kitchen at sunrise. A woman in her 30s makes coffee at the counter. Soft pastels, organic textures, plain mugs visible.",
    flags: [],
    slots: [
      {
        slot_id: "slot_01",
        label: "empty coffee mug on the counter",
        timestamp: 2.4,
        bbox: [0.42, 0.55, 0.12, 0.18],
      },
      {
        slot_id: "slot_02",
        label: "blank cereal box on the shelf",
        timestamp: 5.1,
        bbox: [0.18, 0.3, 0.1, 0.14],
      },
    ],
  },
  {
    scene_id: "scene_park_afternoon",
    clip_url: "/clips/park-afternoon.mp4",
    duration: 9.0,
    // The advertiser agent's view (context) deliberately does not mention the
    // minor. The platform's safety view (flags) does. Agents bid on commercial
    // fit; oversight catches the policy violation.
    context:
      "An outdoor public park on a bright summer afternoon — people relaxing on picnic blankets, a casual social-leisure atmosphere, unbranded drink bottles in shot.",
    flags: ["minor_present"],
    slots: [
      {
        slot_id: "slot_03",
        label: "unbranded drink bottle on picnic blanket",
        timestamp: 3.2,
        bbox: [0.55, 0.6, 0.08, 0.16],
      },
      {
        slot_id: "slot_04",
        label: "blank logo on father's t-shirt",
        timestamp: 6.8,
        bbox: [0.28, 0.35, 0.1, 0.1],
      },
    ],
  },
];

export function getSceneById(scene_id: string): Scene | undefined {
  return scenes.find((s) => s.scene_id === scene_id);
}
