import { useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Checklist from "@/components/Checklist";
import ColorPicker from "@/components/ColorPicker";
import Icon from "@/components/Icon";
import Tip from "@/components/Tip";
import { useTheme } from "@/hooks/useTheme";
import { newItem, useNotes } from "@/store/notesStore";
import { noteBg } from "@/theme";

const noOutline = Platform.select({ web: { outlineStyle: "none" }, default: {} });

// "Take a note..." bar that expands into a mini editor (text note or checklist).
// defaultLabels: label ids new notes start with (used on a label's page).
export default function Composer({ defaultLabels = [] }) {
  const c = useTheme();
  const add = useNotes((s) => s.add);
  // null = collapsed, otherwise "text" | "list"
  const [mode, setMode] = useState(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [items, setItems] = useState([]);
  const [color, setColor] = useState("default");
  const bodyRef = useRef(null);

  const start = (type) => {
    setItems(type === "list" ? [newItem()] : []);
    setMode(type);
  };

  const close = () => {
    const cleanItems = items.filter((i) => i.text.trim());
    const hasContent =
      title.trim() || (mode === "list" ? cleanItems.length > 0 : body.trim());
    if (hasContent) {
      add({
        type: mode,
        title: title.trim(),
        body: mode === "text" ? body.trim() : "",
        items: mode === "list" ? cleanItems : [],
        color,
        labels: defaultLabels,
      });
    }
    setTitle("");
    setBody("");
    setItems([]);
    setColor("default");
    setMode(null);
  };

  const shell = {
    backgroundColor: noteBg(color, c.dark),
    borderColor: c.border,
  };

  if (!mode) {
    return (
      <Pressable style={[styles.box, styles.collapsed, shell]} onPress={() => start("text")}>
        <Text style={[styles.placeholder, { color: c.muted }]}>Take a note...</Text>
        <Tip label="New list">
          <Pressable onPress={() => start("list")} hitSlop={8}>
            <Icon name="check-box" size={22} color={c.muted} />
          </Pressable>
        </Tip>
      </Pressable>
    );
  }

  return (
    <View style={[styles.box, shell]}>
      <TextInput
        autoFocus={mode === "text"}
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        placeholderTextColor={c.muted}
        style={[styles.title, noOutline, { color: c.text }]}
        returnKeyType="next"
        onSubmitEditing={() => bodyRef.current?.focus()}
      />
      {mode === "text" ? (
        <TextInput
          ref={bodyRef}
          value={body}
          onChangeText={setBody}
          placeholder="Take a note..."
          placeholderTextColor={c.muted}
          multiline
          style={[styles.body, noOutline, { color: c.text }]}
        />
      ) : (
        <Checklist items={items} onChange={setItems} focusFirst />
      )}
      <ColorPicker value={color} onChange={setColor} />
      <View style={styles.footer}>
        <Pressable onPress={close}>
          <Text style={[styles.close, { color: c.text }]}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 10,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  collapsed: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  placeholder: { fontSize: 15 },
  title: { fontSize: 16, fontWeight: "600", padding: 0 },
  body: { fontSize: 14, minHeight: 60, padding: 0, textAlignVertical: "top" },
  footer: { flexDirection: "row", justifyContent: "flex-end" },
  close: { fontSize: 14, fontWeight: "600", padding: 4 },
});
