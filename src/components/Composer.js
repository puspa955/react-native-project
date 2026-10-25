import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "@/components/Icon";
import NoteEditor from "@/components/NoteEditor";
import Tip from "@/components/Tip";
import { useTheme } from "@/hooks/useTheme";
import { createNote } from "@/lib/openNote";
import { newItem, useNotes } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";

// The web "Take a note..." bar. Clicking it makes a real (empty) note and shows the normal
// editor card right here, with the same buttons as the note dialog. Closing an empty card
// deletes the note again; while it is open the note is hidden from the grid below.
// defaultLabels: label ids new notes start with (used on a label's page).
export default function Composer({ defaultLabels = [] }) {
  const c = useTheme();
  const router = useRouter();
  const [noteId, setNoteId] = useState(null);
  const setComposingId = useSettings((s) => s.setComposingId);

  useEffect(() => {
    setComposingId(noteId);
    return () => setComposingId(null);
  }, [noteId, setComposingId]);

  const start = (type) => {
    const id = useNotes.getState().add({
      type,
      labels: defaultLabels,
      items: type === "list" ? [newItem()] : [],
    });
    setNoteId(id);
  };

  if (noteId) {
    return <NoteEditor noteId={noteId} variant="inline" onClose={() => setNoteId(null)} />;
  }

  return (
    <Pressable
      style={[styles.bar, { backgroundColor: c.surface, borderColor: c.border }]}
      onPress={() => start("text")}
    >
      <Text style={[styles.placeholder, { color: c.muted }]}>Take a note...</Text>
      <View style={styles.shortcuts}>
        <Tip label="New list">
          <Pressable onPress={() => start("list")} hitSlop={8}>
            <Icon name="check-box" size={22} color={c.muted} />
          </Pressable>
        </Tip>
        <Tip label="New note with drawing">
          <Pressable
            onPress={() => createNote(router, { labels: defaultLabels, action: "draw" })}
            hitSlop={8}
          >
            <Icon name="brush" size={22} color={c.muted} />
          </Pressable>
        </Tip>
        <Tip label="New note with image">
          <Pressable
            onPress={() => createNote(router, { labels: defaultLabels, action: "image" })}
            hitSlop={8}
          >
            <Icon name="image" size={22} color={c.muted} />
          </Pressable>
        </Tip>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  placeholder: { fontSize: 15 },
  shortcuts: { flexDirection: "row", alignItems: "center", gap: 18 },
});
