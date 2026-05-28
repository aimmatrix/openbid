// lib/oversight/rules.ts
// Brand-safety rules evaluated against auction winners and runner-ups.

import type { Campaign, Scene } from "@/lib/types";

export interface SafetyRule {
  id: string;
  reason: string;
  matches: (scene: Scene, campaign: Campaign | undefined) => boolean;
}

export const SAFETY_RULES: SafetyRule[] = [
  {
    id: "alcohol_x_minor",
    matches: (scene, c) =>
      !!c && c.category === "alcohol" && scene.flags.includes("minor_present"),
    reason:
      "Alcohol-category brand cannot serve in scenes flagged minor_present. Promoting runner-up.",
  },
  {
    id: "violence_guardrail",
    matches: (scene, c) =>
      !!c && c.guardrails.includes("no_violence") && scene.flags.includes("violence"),
    reason:
      "Brand has no_violence guardrail; scene contains violence. Promoting runner-up.",
  },
];

export function findTriggeredRule(
  scene: Scene,
  campaign: Campaign | undefined,
): SafetyRule | undefined {
  return SAFETY_RULES.find((rule) => rule.matches(scene, campaign));
}

export function isEligible(scene: Scene, campaign: Campaign | undefined): boolean {
  return !findTriggeredRule(scene, campaign);
}
