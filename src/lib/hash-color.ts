/**
 * Deterministic HSL color from any string. Used for avatar gradients,
 * tag colors, etc. Stable across sessions and devices.
 */
export function hashColor(input: string): { h: number; s: number; l: number } {
  let hash = 0;
  const str = input || "?";
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const h = Math.abs(hash) % 360;
  return { h, s: 62, l: 48 };
}

export function hashGradient(input: string): string {
  const a = hashColor(input);
  const b = { h: (a.h + 40) % 360, s: a.s, l: a.l + 6 };
  return `linear-gradient(135deg, hsl(${a.h} ${a.s}% ${a.l}%), hsl(${b.h} ${b.s}% ${b.l}%))`;
}

export function getInitials(name: string | null | undefined, fallback = "?"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}