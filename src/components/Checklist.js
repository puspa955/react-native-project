import { useRef } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { newItem } from "@/store/notesStore";

const noOutline = Platform.select({ web: { outlineStyle: "none" }, default: {} });

// Controlled checklist editor: parent owns `items`, we call onChange with the new array.
export default function Checklist({ items, onChange, focusFirst = false }) {
  const c = useTheme();
  // the item that should grab focus when it mounts (a freshly added row)
  const focusId = useRef(focusFirst ? items.find((i) => !i.text)?.id : null);

  const patch = (id, p) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...p } : i)));

  const addAfter = (id) => {
    const item = newItem();
    focusId.current = item.id;
    const idx = id ? items.findIndex((i) => i.id === id) + 1 : items.length;
    onChange([...items.slice(0, idx), item, ...items.slice(idx)]);
  };

  const remove = (id) => onChange(items.filter((i) => i.id !== id));

  const row = (item) => (
    <View key={item.id} style={styles.row}>
      <Pressable onPress={() => patch(item.id, { done: !item.done })} hitSlop={6}>
        <Text style={[styles.box, { color: c.text }]}>{item.done ? "☑" : "☐"}</Text>
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
      <Pressable onPress={() => remove(item.id)} hitSlop={6}>
        <Text style={[styles.x, { color: c.muted }]}>✕</Text>
      </Pressable>
    </View>
  );

  const open = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  return (
    <View style={styles.wrap}>
      {open.map(row)}
      <Pressable onPress={() => addAfter(null)} style={styles.add}>
        <Text style={[styles.addText, { color: c.muted }]}>+ List item</Text>
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
  wrap: { gap: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 32 },
  box: { fontSize: 20 },
  input: { flex: 1, fontSize: 15, padding: 0, paddingVertical: 4 },
  struck: { textDecorationLine: "line-through" },
  x: { fontSize: 14, paddingHorizontal: 4 },
  add: { paddingVertical: 6, paddingLeft: 30 },
  addText: { fontSize: 14 },
  label: { fontSize: 11, fontWeight: "600", letterSpacing: 1, marginTop: 10 },
});
