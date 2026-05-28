// lib/adapters/llm.ts
// LLM reasoning. Anthropic preferred, OpenAI as alternate.
// Lane I+S owns this file. Teammates import { reason } and never touch keys.
//
// Side-effect import below: bootstraps Overmind tracing BEFORE the OpenAI
// constructor runs, so the SDK's chat.completions.create gets the
// auto-instrumentation wrap. Don't reorder these imports.

import "./overmind";

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.LLM_MODEL || "claude-opus-4-7";

const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;
const openai = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null;

export interface ReasonOpts {
  system: string;
  user: string;
  maxTokens?: number;
}

/**
 * Returns LLM-generated text. If no API key is set, returns a deterministic
 * fixture so teammates can build without secrets.
 */
export async function reason(opts: ReasonOpts): Promise<string> {
  if (anthropic) {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 512,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    });
    const block = res.content[0];
    return block.type === "text" ? block.text : "";
  }

  if (openai) {
    const res = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      max_tokens: opts.maxTokens ?? 512,
    });
    return res.choices?.[0]?.message?.content ?? "";
  }

  // Local fallback so teammates can build without a key.
  return localReasoningFallback(opts);
}

function localReasoningFallback(opts: ReasonOpts): string {
  const sceneHint = opts.user.match(/scene:\s*([^\n.]+)/i)?.[1]?.trim() ?? "scene";
  const brandHint = opts.user.match(/brand:\s*([^\n.]+)/i)?.[1]?.trim() ?? "this brand";
  return `Looking at the ${sceneHint}, I think ${brandHint} fits well — the visual context (warm lighting, organic props) signals an audience that overlaps with our buyer profile. Bidding aggressively given the inventory is high-intent.`;
}
