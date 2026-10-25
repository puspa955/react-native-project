import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { confirmDelete } from "@/lib/confirm";
import { useNotes } from "@/store/notesStore";
import { colors, noteBg } from "@/theme";

export default function NoteCard({ note, inTrash }) {
  const router = useRouter();
  const restore = useNotes((s) => s.restore);
  const remove = useNotes((s) => s.remove);

  const open = () => {
    if (!inTrash) router.push(`/note/${note.id}`);
  };

  return (
    <Pressable
      onPress={open}
      style={({ hovered }) => [
        styles.card,
        { backgroundColor: noteBg(note.color) },
        hovered && styles.hovered,
      ]}
    >
      {note.pinned && <Text style={styles.pin}>📌</Text>}
      {!!note.title && <Text style={styles.title}>{note.title}</Text>}
      {!!note.body && (
        <Text style={styles.body} numberOfLines={10}>
          {note.body}
        </Text>
      )}

      {inTrash && (
        <View style={styles.actions}>
          <Pressable onPress={() => restore(note.id)}>
            <Text style={styles.action}>Restore</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              confirmDelete("Delete forever?", "This can't be undone.", () =>
                remove(note.id)
              )
            }
          >
            <Text style={[styles.action, { color: colors.danger }]}>
              Delete forever
            </Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  hovered: {
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  pin: { position: "absolute", top: 6, right: 8, fontSize: 12 },
  title: { fontSize: 16, fontWeight: "600", color: colors.text, paddingRight: 16 },
  body: { fontSize: 14, color: colors.text, lineHeight: 20 },
  actions: { flexDirection: "row", gap: 16, marginTop: 6 },
  action: { fontSize: 13, fontWeight: "600", color: colors.muted },
});
