// Note colors are stored on a note by key; each key has a light and a dark shade.
export const NOTE_COLORS = [
  { key: "default", name: "Default", light: "#ffffff", dark: "#202124" },
  { key: "red", name: "Red", light: "#f28b82", dark: "#5c2b29" },
  { key: "orange", name: "Orange", light: "#fbbc04", dark: "#614a19" },
  { key: "yellow", name: "Yellow", light: "#fff475", dark: "#635d19" },
  { key: "green", name: "Green", light: "#ccff90", dark: "#345920" },
  { key: "teal", name: "Teal", light: "#a7ffeb", dark: "#16504b" },
  { key: "blue", name: "Blue", light: "#cbf0f8", dark: "#2d555e" },
  { key: "darkblue", name: "Dark blue", light: "#aecbfa", dark: "#1e3a5f" },
  { key: "purple", name: "Purple", light: "#d7aefb", dark: "#42275e" },
  { key: "pink", name: "Pink", light: "#fdcfe8", dark: "#5b2245" },
  { key: "brown", name: "Brown", light: "#e6c9a8", dark: "#442f19" },
  { key: "gray", name: "Gray", light: "#e8eaed", dark: "#3c3f43" },
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
  primary: "#f9ab00", // rings, selected states, check marks
  link: "#b06000", // text buttons and links (darker amber so it stays readable on white)
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
  primary: "#fbbc04",
  link: "#fdd663",
  input: "#525355",
};

export const SIDEBAR_WIDTH = 240;
export const RAIL_WIDTH = 72; // collapsed sidebar (icons only)
export const WIDE_BREAKPOINT = 768;
