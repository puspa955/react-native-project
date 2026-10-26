import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { INK_COLORS, Stroke, TOOL_SIZE, useInkColor } from "@/components/Drawing";
import Icon from "@/components/Icon";
import Tip from "@/components/Tip";
import { useTheme } from "@/hooks/useTheme";
import { newId } from "@/lib/id";
import { IS_WEB } from "@/lib/platform";

const MIN_STEP = 3; // ignore pointer moves shorter than this (keeps strokes light)
const ERASE_RADIUS = 14;
const GROW_MARGIN = 140; // when a stroke gets this close to the bottom edge of the page...
const GROW_STEP = 400; // ...the page gets this much longer, so you can keep drawing downwards
const SCROLL_MARGIN = 100; // near the bottom of the visible area the view scrolls along with the pen
const MIN_SAVED_HEIGHT = 160;

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
  // The canvas is a tall "page" inside a scroll view: it starts as tall as the visible area and
  // grows downwards while you draw near its bottom (canvasH = extra length asked for so far).
  // The sizes come from the window, not from layout events (those were unreliable on the web):
  // the dialog is full screen with a 12px margin and 1px border on each side.
  const { width: winW, height: winH } = useWindowDimensions();
  const canvasW = Math.max(1, Math.round(winW - 26));
  const visibleH = Math.max(300, Math.round(winH - 330)); // room left between the top and bottom bars
  const [canvasH, setCanvasH] = useState(0); // 0 = just fill the visible area
  const pageH = Math.max(canvasH, visibleH);
  const scrollRef = useRef(null);
  const scrollY = useRef(0); // how far the page is scrolled
  const geometry = useRef({ viewH: 0, canvasH: 0 }); // latest sizes for the PanResponder
  geometry.current = { viewH: visibleH, canvasH: pageH };
  const [state, dispatch] = useReducer(reducer, { strokes: [], undo: [], redo: [] });

  // an existing drawing: load it once, scaled to this screen's page width
  useEffect(() => {
    if (!initial) return;
    const k = initial.width >= 50 ? canvasW / initial.width : 1;
    dispatch({
      type: "load",
      strokes: initial.strokes.map((st) => ({
        ...st,
        points: st.points.map(([x, y]) => [x * k, y * k]),
      })),
    });
    setCanvasH(Math.ceil(initial.height * k) + GROW_STEP / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [tool, setTool] = useState("pen"); // "pen" | "marker" | "eraser" | "hand" (scroll, phones)
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
    let scrollAtStart = 0;
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
      // with the hand tool the scroll view handles the drag instead
      onStartShouldSetPanResponder: () => ref.current.tool !== "hand",
      onMoveShouldSetPanResponder: () => ref.current.tool !== "hand",
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const x = e.nativeEvent.locationX;
        const y = e.nativeEvent.locationY;
        start = [x, y];
        scrollAtStart = scrollY.current;
        const { tool: t, color: col } = ref.current;
        if (t === "eraser") return erase(x, y);
        setLive({ id: newId(), tool: t, color: col, size: TOOL_SIZE[t], points: [[x, y]] });
      },
      onPanResponderMove: (_, g) => {
        const x = start[0] + g.dx;
        // the page may have scrolled since the touch began, so add that distance
        const y = start[1] + g.dy + (scrollY.current - scrollAtStart);
        const { viewH: vh, canvasH: ch } = geometry.current;
        // near the bottom of the page: make it longer
        if (y > ch - GROW_MARGIN) setCanvasH((h) => Math.max(h, y + GROW_STEP));
        // near the bottom of what is visible: scroll down so the pen stays in view
        const intoEdge = y - (scrollY.current + vh - SCROLL_MARGIN); // how far past the edge zone
        if (intoEdge > 0) {
          // gentle near the edge, faster the further the pen goes (never more than 14px a step)
          scrollY.current += Math.min(14, 2 + intoEdge * 0.12);
          scrollRef.current?.scrollTo({ y: scrollY.current, animated: false });
        }
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
    // keep only the part that was used (plus some room), not the whole grown page
    const lowest = Math.max(...state.strokes.flatMap((st) => st.points.map(([, y]) => y + st.size)));
    onSave({
      id: drawingId,
      width: canvasW,
      height: Math.max(MIN_SAVED_HEIGHT, Math.ceil(lowest + 40)),
      strokes: state.strokes,
    });
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

      <ScrollView
        ref={scrollRef}
        style={[styles.canvas, { backgroundColor: c.surface, borderColor: c.border }]}
        // phones: one finger draws, so scrolling is only on with the hand tool. Web: the mouse
        // wheel / trackpad always scrolls, and dragging draws.
        scrollEnabled={IS_WEB || tool === "hand"}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false} // so the page keeps the same width as it grows
        onScroll={(e) => {
          scrollY.current = e.nativeEvent.contentOffset.y;
        }}
        contentContainerStyle={styles.pageContent}
      >
        <View
          style={{ flexGrow: 1, minHeight: pageH }}
          {...pan.panHandlers}
        >
          {visibleStrokes.map((st) => (
            <Stroke key={st.id} stroke={st} color={ink(st.color)} />
          ))}
          {live && <Stroke stroke={live} color={ink(live.color)} />}
        </View>
      </ScrollView>

      <View style={[styles.bar, { borderTopColor: c.border, paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.row}>
          {toolBtn("pen", "edit", "Pen")}
          {toolBtn("marker", "brush", "Marker")}
          {toolBtn("eraser", "auto-fix-normal", "Eraser")}
          {!IS_WEB && toolBtn("hand", "pan-tool", "Scroll the page")}
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
        {(tool === "pen" || tool === "marker") && (
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
  canvas: { flex: 1, margin: 12, borderWidth: 1, borderRadius: 8 },
  pageContent: { flexGrow: 1 },
  bar: { paddingHorizontal: 12, paddingTop: 8, gap: 10, borderTopWidth: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  tool: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  off: { opacity: 0.3 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, marginRight: 6 },
});
