// Note colors are stored on a note by key; each key has a light and a dark shade.
export const NOTE_COLORS = [
  { key: "default", light: "#ffffff", dark: "#202124" },
  { key: "red", light: "#f28b82", dark: "#5c2b29" },
  { key: "orange", light: "#fbbc04", dark: "#614a19" },
  { key: "yellow", light: "#fff475", dark: "#635d19" },
  { key: "green", light: "#ccff90", dark: "#345920" },
  { key: "teal", light: "#a7ffeb", dark: "#16504b" },
  { key: "blue", light: "#cbf0f8", dark: "#2d555e" },
  { key: "darkblue", light: "#aecbfa", dark: "#1e3a5f" },
  { key: "purple", light: "#d7aefb", dark: "#42275e" },
  { key: "pink", light: "#fdcfe8", dark: "#5b2245" },
  { key: "brown", light: "#e6c9a8", dark: "#442f19" },
  { key: "gray", light: "#e8eaed", dark: "#3c3f43" },
];

export function noteBg(key, dark) {
  const c = NOTE_COLORS.find((x) => x.key === key) || NOTE_COLORS[0];
  return dark ? c.dark : c.light;
}

export const lightColors = {
  bg: "#ffffff",
  surface: "#ffffff",
  border: "#e0e0e0",
  text: "#202124",
  muted: "#5f6368",
  hover: "#f1f3f4",
  active: "#feefc3",
  danger: "#d93025",
  link: "#1a73e8",
  input: "#f1f3f4",
};

export const darkColors = {
  bg: "#202124",
  surface: "#202124",
  border: "#5f6368",
  text: "#e8eaed",
  muted: "#9aa0a6",
  hover: "#2d2e31",
  active: "#41331c",
  danger: "#f28b82",
  link: "#8ab4f8",
  input: "#525355",
};

export const SIDEBAR_WIDTH = 240;
export const WIDE_BREAKPOINT = 768;
