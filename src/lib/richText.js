// Text notes keep their words in `body` (lines separated by "\n", so search keeps working) and
// the look of each line in `lineFormats`, a list with one entry per line:
//   { h: 0 | 1 | 2,  b, i, u, s: true/false,  color: null | "#rrggbb" }
// h: 0 = normal text, 1 = heading, 2 = subheading. A missing entry means "normal".

export const DEFAULT_FMT = { h: 0, b: false, i: false, u: false, s: false, color: null };

// text colours offered in the formatting bar (null = the theme's normal text colour)
export const TEXT_COLORS = [
  { value: null, name: "Default" },
  { value: "#d93025", name: "Red" },
  { value: "#e37400", name: "Orange" },
  { value: "#188038", name: "Green" },
  { value: "#1a73e8", name: "Blue" },
  { value: "#9334e6", name: "Purple" },
];

// the note's lines and a format for every one of them
export function splitBody(note) {
  const lines = (note.body ?? "").split("\n");
  const fmts = lines.map((_, i) => ({ ...DEFAULT_FMT, ...(note.lineFormats?.[i] || {}) }));
  return { lines, fmts };
}

export function isFormatted(fmt) {
  return fmt.h !== 0 || fmt.b || fmt.i || fmt.u || fmt.s || fmt.color !== null;
}

// React Native style for a line. `size`: "edit" (the editor) or "card" (smaller, on note cards).
export function lineStyle(fmt, textColor, size = "edit") {
  const sizes = size === "card" ? { 0: 14, 1: 19, 2: 16 } : { 0: 16, 1: 26, 2: 20 };
  const fontSize = sizes[fmt.h];
  const decoration = [fmt.u && "underline", fmt.s && "line-through"].filter(Boolean).join(" ");
  return {
    fontSize,
    lineHeight: Math.round(fontSize * 1.45),
    fontWeight: fmt.b || fmt.h ? "700" : "400",
    fontStyle: fmt.i ? "italic" : "normal",
    textDecorationLine: decoration || "none",
    color: fmt.color || textColor,
  };
}
