import type { RenderRequest, RenderResult } from "@/lib/types";
import { getSceneById } from "@/mocks/scenes";

export async function composite(req: RenderRequest): Promise<RenderResult> {
  const scene = getSceneById(req.scene_id);
  return {
    asset_url: scene?.clip_url ?? `/clips/${req.scene_id}.mp4`,
    tier: 1,
    disclosure: `Sponsored · ${req.brand}`,
  };
}
