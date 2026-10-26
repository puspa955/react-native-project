import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Icon from "@/components/Icon";
import Sheet from "@/components/Sheet";
import { useTheme } from "@/hooks/useTheme";
import { useNotes } from "@/store/notesStore";

const noOutline = Platform.select({ web: { outlineStyle: "none" }, default: {} });

// "Add label" dialog: tick the labels a note should have, or create a new one on the spot.
// For one note pass noteId; for several notes pass noteIds. A label shows ticked only when every
// one of those notes has it, and ticking it adds it to all of them (unticking removes it from all).
export default function LabelPicker({ visible, onClose, noteId, noteIds }) {
  const c = useTheme();
  const ids = noteIds ?? [noteId];
  const labels = useNotes((s) => s.labels);
  const notes = useNotes((s) => s.notes);
  const addLabel = useNotes((s) => s.addLabel);
  const toggleNoteLabel = useNotes((s) => s.toggleNoteLabel);
  const [draft, setDraft] = useState("");

  const targets = notes.filter((n) => ids.includes(n.id));
  const hasIt = (n, labelId) => (n.labels || []).includes(labelId);
  const has = (labelId) => targets.length > 0 && targets.every((n) => hasIt(n, labelId));
  const exists = labels.some((l) => l.name.toLowerCase() === draft.trim().toLowerCase());

  // give the label to every note that lacks it (add), or take it from every note that has it
  const apply = (labelId, add) =>
    targets.forEach((n) => {
      if (hasIt(n, labelId) !== add) toggleNoteLabel(n.id, labelId);
    });

  const create = () => {
    const id = addLabel(draft);
    if (id) apply(id, true);
    setDraft("");
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Add label">
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
          <Icon name="add" size={20} color={c.link} />
          <Text style={{ color: c.link }}>Create "{draft.trim()}"</Text>
        </Pressable>
      )}
      <ScrollView style={styles.list}>
        {labels.map((l) => (
          <Pressable key={l.id} onPress={() => apply(l.id, !has(l.id))} style={styles.row}>
            <Icon
              name={has(l.id) ? "check-box" : "check-box-outline-blank"}
              size={22}
              color={c.text}
            />
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
  list: { flexGrow: 0 },
  footer: { flexDirection: "row", justifyContent: "flex-end" },
});
