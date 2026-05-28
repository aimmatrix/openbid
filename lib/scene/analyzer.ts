// lib/scene/analyzer.ts
// BACKEND lane — you own this file.
//
// Returns a Scene given an id. For the hackathon demo we hardcode 2 scenes
// (already defined in mocks/scenes.ts). Do NOT attempt live vision detection
// — it's a time sink and the slot data is what matters, not how it's derived.
//
// Lane I+S has wired the rest of the pipeline to call this. Just make
// getScene() return a Scene that conforms to lib/types.ts.

import type { Scene } from "@/lib/types";
import { scenes, getSceneById } from "@/mocks/scenes";

export function getScene(scene_id: string): Scene {
  const found = getSceneById(scene_id);
  if (!found) throw new Error(`Unknown scene: ${scene_id}`);
  return found;
}

export function listScenes(): Scene[] {
  return scenes;
}
