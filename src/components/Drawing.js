import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";

// Drawings are stored as vector strokes: { id, tool: "pen" | "marker", color, size, points: [[x, y], ...] }.
// They are drawn with plain Views (a small rotated rounded rectangle per piece of line), so no
// SVG/canvas library is needed and it looks the same on web, iOS and Android.

export const INK_COLORS = [
  { key: "auto", name: "Default" }, // black on light theme, white on dark
  { key: "#d93025", name: "Red" },
  { key: "#f9ab00", name: "Orange" },
  { key: "#188038", name: "Green" },
  { key: "#1a73e8", name: "Blue" },
  { key: "#9334e6", name: "Purple" },
];

export const TOOL_SIZE = { pen: 3.5, marker: 16 };

function Segment({ x0, y0, x1, y1, w, color }) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  return (
    <View
      style={{
        position: "absolute",
        left: (x0 + x1) / 2 - (len + w) / 2,
        top: (y0 + y1) / 2 - w / 2,
        width: len + w, // + w so both ends have a round cap
        height: w,
        borderRadius: w / 2,
        backgroundColor: color,
        transform: [{ rotate: `${angle}rad` }],
      }}
    />
  );
}

// One stroke. `scale` resizes it (thumbnails); `color` is the already-resolved color.
export const Stroke = memo(function Stroke({ stroke, scale = 1, color }) {
  const w = Math.max(1, stroke.size * scale);
  const pts = stroke.points;
  const pieces = [];

  if (pts.length === 1) {
    const [x, y] = pts[0];
    pieces.push(<Segment key={0} x0={x * scale} y0={y * scale} x1={x * scale} y1={y * scale} w={w} color={color} />);
  }
  for (let i = 1; i < pts.length; i++) {
    pieces.push(
      <Segment
        key={i}
        x0={pts[i - 1][0] * scale}
        y0={pts[i - 1][1] * scale}
        x1={pts[i][0] * scale}
        y1={pts[i][1] * scale}
        w={w}
        color={color}
      />
    );
  }

  return (
    <View
      pointerEvents="none"
      // marker = see-through; the opacity is applied to the whole stroke so overlaps stay even
      needsOffscreenAlphaCompositing
      style={[StyleSheet.absoluteFill, { opacity: stroke.tool === "marker" ? 0.4 : 1 }]}
    >
      {pieces}
    </View>
  );
});

export function useInkColor() {
  const c = useTheme();
  return (key) => (key === "auto" ? c.text : key);
}

// Shows a saved drawing at the given width (height keeps the drawing's shape).
export function DrawingView({ drawing, width }) {
  const ink = useInkColor();
  const scale = width / drawing.width;
  return (
    <View style={{ width, height: drawing.height * scale, overflow: "hidden" }} pointerEvents="none">
      {drawing.strokes.map((s) => (
        <Stroke key={s.id} stroke={s} scale={scale} color={ink(s.color)} />
      ))}
    </View>
  );
}
