import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Sheet from "@/components/Sheet";
import { useTheme } from "@/hooks/useTheme";
import { useNotes } from "@/store/notesStore";

const noOutline = Platform.select({ web: { outlineStyle: "none" }, default: {} });

// "Label note" dialog: tick the labels a note should have, or create a new one on the spot.
export default function LabelPicker({ visible, onClose, noteId }) {
  const c = useTheme();
  const labels = useNotes((s) => s.labels);
  const selected = useNotes((s) => s.notes.find((n) => n.id === noteId)?.labels);
  const addLabel = useNotes((s) => s.addLabel);
  const toggleNoteLabel = useNotes((s) => s.toggleNoteLabel);
  const [draft, setDraft] = useState("");

  const has = (id) => (selected || []).includes(id);
  const exists = labels.some((l) => l.name.toLowerCase() === draft.trim().toLowerCase());

  const create = () => {
    const id = addLabel(draft);
    if (id && !has(id)) toggleNoteLabel(noteId, id);
    setDraft("");
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Label note">
      <View style={styles.row}>
        <TextInput
          autoFocus
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={create}
          placeholder="Enter label name"
          placeholderTextColor={c.muted}
          style={[styles.input, noOutline, { color: c.text }]}
        />
      </View>
      {!!draft.trim() && !exists && (
        <Pressable onPress={create} style={styles.row}>
          <Text style={{ color: c.link }}>＋ Create "{draft.trim()}"</Text>
        </Pressable>
      )}
      <ScrollView style={styles.list}>
        {labels.map((l) => (
          <Pressable key={l.id} onPress={() => toggleNoteLabel(noteId, l.id)} style={styles.row}>
            <Text style={[styles.box, { color: c.text }]}>{has(l.id) ? "☑" : "☐"}</Text>
            <Text style={{ color: c.text, fontSize: 15, flex: 1 }}>{l.name}</Text>
          </Pressable>
        ))}
        {labels.length === 0 && !draft.trim() && (
          <Text style={{ color: c.muted, paddingVertical: 8 }}>
            No labels yet. Type a name above to create one.
          </Text>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <Pressable onPress={onClose}>
          <Text style={{ color: c.text, fontWeight: "600", padding: 4 }}>Done</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 40 },
  input: { flex: 1, fontSize: 15, padding: 0, paddingVertical: 8 },
  box: { fontSize: 20 },
  list: { flexGrow: 0 },
  footer: { flexDirection: "row", justifyContent: "flex-end" },
});
