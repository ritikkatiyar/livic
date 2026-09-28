/**
 * Returns `color` at the given opacity, e.g. withAlpha(theme.Colors.primary, 0.1).
 * Use this instead of hardcoded rgba(...) literals so tints follow the active theme.
 * Accepts #rgb, #rrggbb and rgb()/rgba() inputs (an existing alpha is replaced).
 */
export function withAlpha(color: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  const value = color.trim();

  if (value.startsWith('#')) {
    let hex = value.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  const match = value.match(/^rgba?\(([^)]+)\)$/i);
  if (match) {
    const [r, g, b] = match[1].split(',').map((part) => part.trim());
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  return value;
}
