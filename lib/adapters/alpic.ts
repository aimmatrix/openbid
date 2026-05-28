// lib/adapters/alpic.ts
// Optional: expose the auction engine + agent tools as MCP servers deployed
// via Alpic. Bonus prize — only wire if ahead of schedule.
//
// For now this is a placeholder that documents the intended integration.
// The actual MCP server config lives in `alpic.config.ts` (TBD) once we get
// the Alpic quickstart from reps at the event.

export const ALPIC_ENABLED = !!process.env.ALPIC_TOKEN;

export function alpicEndpointUrl(): string | null {
  return process.env.ALPIC_ENDPOINT_URL || null;
}

// Placeholder: register the auction engine as an MCP tool. Implementation
// deferred until we have the Alpic SDK or quickstart link.
export async function registerAuctionTool(): Promise<void> {
  if (!ALPIC_ENABLED) return;
  console.log("[alpic] tool registration is a TODO — talk to Alpic reps for quickstart.");
}
