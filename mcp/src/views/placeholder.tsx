// mcp/src/views/placeholder.tsx
// Skybridge's build pipeline requires at least one view to bundle, even when
// none of our MCP tools render UI. This component is intentionally empty —
// it's never referenced by any registered tool.

export default function Placeholder() {
  return null;
}
