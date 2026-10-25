import { useMemo, useRef, useState } from "react";
import { PanResponder, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Icon from "@/components/Icon";
import Tip from "@/components/Tip";
import { useTheme } from "@/hooks/useTheme";
import { newItem } from "@/store/notesStore";

const noOutline = Platform.select({ web: { outlineStyle: "none" }, default: {} });
const ROW_H = 36; // fixed row height, so we can work out which slot a dragged row is over

// The grip on the left of a row. Drag it up/down to reorder.
// onStart(), onMove(dy), onEnd(dy): dy = how far the finger moved vertically.
function DragHandle({ onStart, onMove, onEnd, color }) {
  const cb = useRef({});
  cb.current = { onStart, onMove, onEnd }; // PanResponder is created once; read the latest callbacks
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false, // don't let the scroll view steal the drag
        onPanResponderGrant: () => cb.current.onStart(),
        onPanResponderMove: (_, g) => cb.current.onMove(g.dy),
        onPanResponderRelease: (_, g) => cb.current.onEnd(g.dy),
        onPanResponderTerminate: (_, g) => cb.current.onEnd(g.dy),
      }),
    []
  );
  return (
    <View {...pan.panHandlers} style={styles.handle} accessibilityLabel="Drag to reorder">
      <Icon name="drag-indicator" size={20} color={color} />
    </View>
  );
}

// Controlled checklist editor: parent owns `items`, we call onChange with the new array.
export default function Checklist({ items, onChange, focusFirst = false }) {
  const c = useTheme();
  // the item that should grab focus when it mounts (a freshly added row)
  const focusId = useRef(focusFirst ? items.find((i) => !i.text)?.id : null);
  const [drag, setDrag] = useState(null); // { id, dy } while a row is being dragged

  const open = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  const patch = (id, p) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...p } : i)));

  const addAfter = (id) => {
    const item = newItem();
    focusId.current = item.id;
    const idx = id ? items.findIndex((i) => i.id === id) + 1 : items.length;
    onChange([...items.slice(0, idx), item, ...items.slice(idx)]);
  };

  const remove = (id) => onChange(items.filter((i) => i.id !== id));

  // which slot a row dragged by dy ends up in
  const targetIndex = (from, dy) =>
    Math.max(0, Math.min(open.length - 1, Math.round(from + dy / ROW_H)));

  // Put the dragged unchecked item into its new slot. Checked items keep their places.
  const commitDrag = (id, dy) => {
    const from = open.findIndex((i) => i.id === id);
    const to = targetIndex(from, dy);
    setDrag(null);
    if (from < 0 || from === to) return;
    const reordered = [...open];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    let k = 0;
    onChange(items.map((i) => (i.done ? i : reordered[k++])));
  };

  // visual offset of an unchecked row while another (or itself) is being dragged
  const offsetOf = (index, id) => {
    if (!drag) return 0;
    const from = open.findIndex((i) => i.id === drag.id);
    if (id === drag.id) return drag.dy;
    const to = targetIndex(from, drag.dy);
    if (from < to && index > from && index <= to) return -ROW_H;
    if (from > to && index >= to && index < from) return ROW_H;
    return 0;
  };

  const row = (item, index) => {
    const dragging = drag?.id === item.id;
    return (
      <View
        key={item.id}
        style={[
          styles.row,
          !item.done && { transform: [{ translateY: offsetOf(index, item.id) }] },
          dragging && [styles.dragging, { backgroundColor: c.hover }],
        ]}
      >
        {item.done ? (
          <View style={styles.handle} />
        ) : (
          <DragHandle
            color={c.muted}
            onStart={() => setDrag({ id: item.id, dy: 0 })}
            onMove={(dy) => setDrag((d) => d && { ...d, dy })}
            onEnd={(dy) => commitDrag(item.id, dy)}
          />
        )}
        <Pressable onPress={() => patch(item.id, { done: !item.done })} hitSlop={6}>
          <Icon
            name={item.done ? "check-box" : "check-box-outline-blank"}
            size={22}
            color={item.done ? c.muted : c.text}
          />
        </Pressable>
        <TextInput
          value={item.text}
          onChangeText={(t) => patch(item.id, { text: t })}
          placeholder="List item"
          placeholderTextColor={c.muted}
          autoFocus={item.id === focusId.current}
          onSubmitEditing={() => addAfter(item.id)}
          blurOnSubmit={false}
          style={[
            styles.input,
            noOutline,
            { color: item.done ? c.muted : c.text },
            item.done && styles.struck,
          ]}
        />
        <Tip label="Delete item">
          <Pressable onPress={() => remove(item.id)} hitSlop={6}>
            <Icon name="close" size={18} color={c.muted} />
          </Pressable>
        </Tip>
      </View>
    );
  };

  return (
    <View style={styles.wrap}>
      {open.map(row)}
      <Pressable onPress={() => addAfter(null)} style={styles.add}>
        <View style={styles.handle} />
        <Icon name="add" size={22} color={c.muted} />
        <Text style={[styles.addText, { color: c.muted }]}>List item</Text>
      </Pressable>
      {done.length > 0 && (
        <>
          <Text style={[styles.label, { color: c.muted }]}>
            COMPLETED ({done.length})
          </Text>
          {done.map(row)}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, height: ROW_H, borderRadius: 4 },
  dragging: {
    zIndex: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  handle: { width: 20, alignItems: "center", justifyContent: "center", cursor: "grab" },
  input: { flex: 1, fontSize: 15, padding: 0, paddingVertical: 4 },
  struck: { textDecorationLine: "line-through" },
  add: { flexDirection: "row", alignItems: "center", gap: 8, height: ROW_H },
  addText: { fontSize: 14 },
  label: { fontSize: 11, fontWeight: "600", letterSpacing: 1, marginTop: 10, marginBottom: 2 },
});
