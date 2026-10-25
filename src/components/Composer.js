import { useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import ColorPicker from "@/components/ColorPicker";
import { useNotes } from "@/store/notesStore";
import { colors, noteBg } from "@/theme";

const noOutline = Platform.select({ web: { outlineStyle: "none" }, default: {} });

// "Take a note..." bar that expands into a mini editor.
export default function Composer() {
  const add = useNotes((s) => s.add);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [color, setColor] = useState("default");
  const bodyRef = useRef(null);

  const close = () => {
    if (title.trim() || body.trim()) {
      add({ title: title.trim(), body: body.trim(), color });
    }
    setTitle("");
    setBody("");
    setColor("default");
    setOpen(false);
  };

  if (!open) {
    return (
      <Pressable style={[styles.box, styles.collapsed]} onPress={() => setOpen(true)}>
        <Text style={styles.placeholder}>Take a note...</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.box, { backgroundColor: noteBg(color) }]}>
      <TextInput
        autoFocus
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
        placeholderTextColor={colors.muted}
        style={[styles.title, noOutline]}
        returnKeyType="next"
        onSubmitEditing={() => bodyRef.current?.focus()}
      />
      <TextInput
        ref={bodyRef}
        value={body}
        onChangeText={setBody}
        placeholder="Take a note..."
        placeholderTextColor={colors.muted}
        multiline
        style={[styles.body, noOutline]}
      />
      <ColorPicker value={color} onChange={setColor} />
      <View style={styles.footer}>
        <Pressable onPress={close}>
          <Text style={styles.close}>Close</Text>
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
  collapsed: { paddingVertical: 14 },
  placeholder: { color: colors.muted, fontSize: 15 },
  title: { fontSize: 16, fontWeight: "600", color: colors.text, padding: 0 },
  body: {
    fontSize: 14,
    color: colors.text,
    minHeight: 60,
    padding: 0,
    textAlignVertical: "top",
  },
  footer: { flexDirection: "row", justifyContent: "flex-end" },
  close: { fontSize: 14, fontWeight: "600", color: colors.text, padding: 4 },
});
