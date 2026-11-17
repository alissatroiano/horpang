// WCAG 2.x contrast helpers. Pure, no DOM.

/** Parse `#rgb` or `#rrggbb` into [r, g, b] (0-255). Throws on invalid input. */
export function parseHex(color: string): [number, number, number] {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!m) throw new Error(`Invalid hex color: ${color}`);
  let h = m[1] ?? '';
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** WCAG relative luminance of a hex color, in [0, 1]. */
export function relativeLuminance(color: string): number {
  const lin = (v: number): number => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const [r8, g8, b8] = parseHex(color);
  const r = lin(r8);
  const g = lin(g8);
  const b = lin(b8);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colors, in [1, 21]. Symmetric. */
export function contrastRatio(fg: string, bg: string): number {
  const a = relativeLuminance(fg);
  const b = relativeLuminance(bg);
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}
