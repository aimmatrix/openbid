// lib/alpic-links.ts
// Client-safe helpers for surfacing the live Alpic MCP deployment in the UI.
// Reads NEXT_PUBLIC_* env vars so the values are inlined into the client
// bundle at build time. Server code should use lib/adapters/alpic instead.

const ENDPOINT = process.env.NEXT_PUBLIC_ALPIC_ENDPOINT_URL;
const PLAYGROUND = process.env.NEXT_PUBLIC_ALPIC_PLAYGROUND_URL;

export interface AlpicLinks {
  enabled: boolean;
  /** Bare host shown in the UI as a compact label (e.g. openbid-mcp-3747dbca.alpic.live). */
  host: string | null;
  /** Streamable HTTP MCP endpoint (judges can paste into Claude / ChatGPT). */
  mcpUrl: string | null;
  /** Human-friendly playground for the live MCP. */
  playgroundUrl: string | null;
}

export function getAlpicLinks(): AlpicLinks {
  if (!ENDPOINT) {
    return { enabled: false, host: null, mcpUrl: null, playgroundUrl: null };
  }
  const base = ENDPOINT.replace(/\/$/, "");
  let host: string | null = null;
  try {
    host = new URL(base).host;
  } catch {
    host = null;
  }
  return {
    enabled: true,
    host,
    mcpUrl: `${base}/mcp`,
    playgroundUrl: PLAYGROUND ?? `${base}/try`,
  };
}
