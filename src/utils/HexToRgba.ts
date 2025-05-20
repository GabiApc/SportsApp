// src/utils/color.ts
export function hexToRgba(hex: string, alpha: number): string {
  // strip leading “#” if present
  const cleaned = hex.replace(/^#/, "");
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
