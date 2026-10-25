// Colors are stored on a note by key, so we can change the palette (e.g. dark mode) later.
export const NOTE_COLORS = [
  { key: "default", value: "#ffffff" },
  { key: "red", value: "#f28b82" },
  { key: "orange", value: "#fbbc04" },
  { key: "yellow", value: "#fff475" },
  { key: "green", value: "#ccff90" },
  { key: "teal", value: "#a7ffeb" },
  { key: "blue", value: "#cbf0f8" },
  { key: "darkblue", value: "#aecbfa" },
  { key: "purple", value: "#d7aefb" },
  { key: "pink", value: "#fdcfe8" },
  { key: "brown", value: "#e6c9a8" },
  { key: "gray", value: "#e8eaed" },
];

export function noteBg(key) {
  return (NOTE_COLORS.find((c) => c.key === key) || NOTE_COLORS[0]).value;
}

export const colors = {
  bg: "#ffffff",
  surface: "#ffffff",
  border: "#e0e0e0",
  text: "#202124",
  muted: "#5f6368",
  hover: "#f1f3f4",
  active: "#feefc3",
  danger: "#d93025",
};

export const SIDEBAR_WIDTH = 240;
export const WIDE_BREAKPOINT = 768;
