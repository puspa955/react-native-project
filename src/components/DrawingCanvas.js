import { useMemo, useReducer, useRef, useState } from "react";
import { Modal, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { INK_COLORS, Stroke, TOOL_SIZE, useInkColor } from "@/components/Drawing";
import Icon from "@/components/Icon";
import Tip from "@/components/Tip";
import { useTheme } from "@/hooks/useTheme";
import { newId } from "@/lib/id";

const MIN_STEP = 3; // ignore pointer moves shorter than this (keeps strokes light)
const ERASE_RADIUS = 14;

// undo/redo: every finished stroke or erase pushes the previous list of strokes on `undo`
function reducer(state, action) {
  switch (action.type) {
    case "commit":
      return { strokes: [...state.strokes, action.stroke], undo: [...state.undo, state.strokes], redo: [] };
    case "erase": {
      const strokes = state.strokes.filter((s) => !action.ids.includes(s.id));
      if (strokes.length === state.strokes.length) return state;
      return { strokes, undo: [...state.undo, state.strokes], redo: [] };
    }
    case "load":
      return { strokes: action.strokes, undo: [], redo: [] };
    case "clear":
      return state.strokes.length
        ? { strokes: [], undo: [...state.undo, state.strokes], redo: [] }
        : state;
    case "undo":
      if (!state.undo.length) return state;
      return {
        strokes: state.undo[state.undo.length - 1],
        undo: state.undo.slice(0, -1),
        redo: [state.strokes, ...state.redo],
      };
    case "redo":
      if (!state.redo.length) return state;
      return {
        strokes: state.redo[0],
        undo: [...state.undo, state.strokes],
        redo: state.redo.slice(1),
      };
    default:
      return state;
  }
}

// distance from point (x, y) to any piece of the stroke
function hits(stroke, x, y, radius) {
  const r = radius + stroke.size / 2;
  const pts = stroke.points;
  if (pts.length === 1) return Math.hypot(pts[0][0] - x, pts[0][1] - y) <= r;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2));
    if (Math.hypot(ax + t * dx - x, ay + t * dy - y) <= r) return true;
  }
  return false;
}

// Full-screen drawing editor. `initial` is an existing drawing (or null for a new one).
// onSave(drawing | null): null means "nothing drawn" (the caller removes the drawing).
export default function DrawingCanvas({ visible, initial, onSave, onClose }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { backgroundColor: c.bg, paddingTop: insets.top }]}>
        <Editor
          key={initial?.id ?? "new"}
          initial={initial}
          insets={insets}
          onSave={onSave}
          onClose={onClose}
        />
      </View>
    </Modal>
  );
}

function Editor({ initial, insets, onSave, onClose }) {
  const c = useTheme();
  const ink = useInkColor();
  const drawingId = useRef(initial?.id ?? newId()).current;
  const loaded = useRef(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [state, dispatch] = useReducer(reducer, { strokes: [], undo: [], redo: [] });
  const [tool, setTool] = useState("pen"); // "pen" | "marker" | "eraser"
  const [color, setColor] = useState("auto");
  const [live, setLive] = useState(null); // the stroke being drawn right now
  const [erasing, setErasing] = useState([]); // ids hidden while the eraser is down

  // PanResponder is created once, so it reads the latest values through refs
  const ref = useRef({});
  ref.current = { tool, color, strokes: state.strokes, live, erasing };

  const pan = useMemo(() => {
    // Where the finger touched down (relative to the canvas), then every later point is that
    // start + how far the finger has moved (dx, dy). More reliable than locationX/Y while moving.
    let start = [0, 0];
    const erase = (x, y) => {
      const { strokes, erasing: hidden } = ref.current;
      const ids = strokes.filter((s) => !hidden.includes(s.id) && hits(s, x, y, ERASE_RADIUS)).map((s) => s.id);
      if (ids.length) setErasing([...hidden, ...ids]);
    };
    const finish = () => {
      const { tool: t, live: stroke, erasing: hidden } = ref.current;
      if (t === "eraser") {
        if (hidden.length) dispatch({ type: "erase", ids: hidden });
        setErasing([]);
      } else if (stroke) {
        dispatch({ type: "commit", stroke });
        setLive(null);
      }
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const x = e.nativeEvent.locationX;
        const y = e.nativeEvent.locationY;
        start = [x, y];
        const { tool: t, color: col } = ref.current;
        if (t === "eraser") return erase(x, y);
        setLive({ id: newId(), tool: t, color: col, size: TOOL_SIZE[t], points: [[x, y]] });
      },
      onPanResponderMove: (_, g) => {
        const x = start[0] + g.dx;
        const y = start[1] + g.dy;
        if (ref.current.tool === "eraser") return erase(x, y);
        setLive((s) => {
          if (!s) return s;
          const [lx, ly] = s.points[s.points.length - 1];
          if (Math.hypot(x - lx, y - ly) < MIN_STEP) return s;
          return { ...s, points: [...s.points, [x, y]] };
        });
      },
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
    });
  }, []);

  const done = () => {
    if (!state.strokes.length) return onSave(null);
    onSave({ id: drawingId, width: size.w, height: size.h, strokes: state.strokes });
  };

  const visibleStrokes = state.strokes.filter((s) => !erasing.includes(s.id));
  const toolBtn = (name, icon, label) => (
    <Tip label={label} placement="top">
      <Pressable
        onPress={() => setTool(name)}
        accessibilityLabel={label}
        style={[styles.tool, tool === name && { backgroundColor: c.active }]}
      >
        <Icon name={icon} size={24} color={c.text} />
      </Pressable>
    </Tip>
  );

  return (
    <>
      <View style={[styles.top, { borderBottomColor: c.border }]}>
        <Tip label="Discard">
          <Pressable onPress={onClose} hitSlop={8}>
            <Icon name="close" size={26} color={c.text} />
          </Pressable>
        </Tip>
        <Text style={[styles.title, { color: c.text }]}>Drawing</Text>
        <Tip label="Save drawing">
          <Pressable onPress={done} hitSlop={8}>
            <Text style={[styles.done, { color: c.link }]}>Done</Text>
          </Pressable>
        </Tip>
      </View>

      <View
        style={[styles.canvas, { backgroundColor: c.surface, borderColor: c.border }]}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setSize({ w: Math.round(width), h: Math.round(height) });
          // the first time we know the canvas width, load an existing drawing scaled to it
          if (!loaded.current && width > 0) {
            loaded.current = true;
            if (initial) {
              const k = width / initial.width;
              dispatch({
                type: "load",
                strokes: initial.strokes.map((st) => ({
                  ...st,
                  points: st.points.map(([x, y]) => [x * k, y * k]),
                })),
              });
            }
          }
        }}
        {...pan.panHandlers}
      >
        {visibleStrokes.map((s) => (
          <Stroke key={s.id} stroke={s} color={ink(s.color)} />
        ))}
        {live && <Stroke stroke={live} color={ink(live.color)} />}
      </View>

      <View style={[styles.bar, { borderTopColor: c.border, paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.row}>
          {toolBtn("pen", "edit", "Pen")}
          {toolBtn("marker", "brush", "Marker")}
          {toolBtn("eraser", "auto-fix-normal", "Eraser")}
          <View style={styles.flex} />
          <Tip label="Undo" placement="top">
            <Pressable
              onPress={() => dispatch({ type: "undo" })}
              style={[styles.tool, !state.undo.length && styles.off]}
            >
              <Icon name="undo" size={24} color={c.text} />
            </Pressable>
          </Tip>
          <Tip label="Redo" placement="top">
            <Pressable
              onPress={() => dispatch({ type: "redo" })}
              style={[styles.tool, !state.redo.length && styles.off]}
            >
              <Icon name="redo" size={24} color={c.text} />
            </Pressable>
          </Tip>
          <Tip label="Clear all" placement="top">
            <Pressable
              onPress={() => dispatch({ type: "clear" })}
              style={[styles.tool, !state.strokes.length && styles.off]}
            >
              <Icon name="delete-outline" size={24} color={c.text} />
            </Pressable>
          </Tip>
        </View>
        {tool !== "eraser" && (
          <View style={styles.row}>
            {INK_COLORS.map((col) => (
              <Tip key={col.key} label={col.name} placement="top">
                <Pressable
                  onPress={() => setColor(col.key)}
                  accessibilityLabel={col.name}
                  style={[
                    styles.swatch,
                    { backgroundColor: ink(col.key), borderColor: c.border },
                    color === col.key && { borderWidth: 3, borderColor: c.primary },
                  ]}
                />
              </Tip>
            ))}
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 17, fontWeight: "600" },
  done: { fontSize: 16, fontWeight: "600" },
  canvas: { flex: 1, margin: 12, borderWidth: 1, borderRadius: 8, overflow: "hidden" },
  bar: { paddingHorizontal: 12, paddingTop: 8, gap: 10, borderTopWidth: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  tool: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  off: { opacity: 0.3 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, marginRight: 6 },
});
