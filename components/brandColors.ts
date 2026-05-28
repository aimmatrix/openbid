const BRAND_COLORS: Record<string, string> = {
  "Lumen Coffee": "#d97706",
  "North Lager": "#ef4444",
  "Kindle Apparel": "#22d3ee",
  "Orbit Snacks": "#84cc16",
};

export function brandColor(brand: string): string {
  return BRAND_COLORS[brand] ?? "#a1a1aa";
}
