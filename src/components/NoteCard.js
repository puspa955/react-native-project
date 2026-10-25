import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import NoteChips from "@/components/NoteChips";
import { useTheme } from "@/hooks/useTheme";
import { confirmDelete } from "@/lib/confirm";
import { useNotes } from "@/store/notesStore";
import { noteBg } from "@/theme";

const MAX_ITEMS = 8;

export default function NoteCard({ note, inTrash }) {
  const c = useTheme();
  const router = useRouter();
  const restore = useNotes((s) => s.restore);
  const remove = useNotes((s) => s.remove);

  const open = () => {
    if (!inTrash) router.push(`/note/${note.id}`);
  };

  const items = note.items || [];
  const shown = [...items.filter((i) => !i.done), ...items.filter((i) => i.done)].slice(
    0,
    MAX_ITEMS
  );

  return (
    <Pressable
      onPress={open}
      style={({ hovered }) => [
        styles.card,
        { backgroundColor: noteBg(note.color, c.dark), borderColor: c.border },
        hovered && styles.hovered,
      ]}
    >
      {note.pinned && <Text style={styles.pin}>📌</Text>}
      {!!note.title && (
        <Text style={[styles.title, { color: c.text }]}>{note.title}</Text>
      )}
      {!!note.body && (
        <Text style={[styles.body, { color: c.text }]} numberOfLines={10}>
          {note.body}
        </Text>
      )}
      {note.type === "list" && (
        <View style={styles.items}>
          {shown.map((i) => (
            <Text
              key={i.id}
              numberOfLines={2}
              style={[
                styles.body,
                { color: i.done ? c.muted : c.text },
                i.done && styles.struck,
              ]}
            >
              {i.done ? "☑" : "☐"} {i.text}
            </Text>
          ))}
          {items.length > MAX_ITEMS && (
            <Text style={[styles.more, { color: c.muted }]}>
              + {items.length - MAX_ITEMS} more
            </Text>
          )}
        </View>
      )}

      <NoteChips note={note} />

      {inTrash && (
        <View style={styles.actions}>
          <Pressable onPress={() => restore(note.id)}>
            <Text style={[styles.action, { color: c.muted }]}>Restore</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              confirmDelete("Delete forever?", "This can't be undone.", () =>
                remove(note.id)
              )
            }
          >
            <Text style={[styles.action, { color: c.danger }]}>Delete forever</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 6 },
  hovered: {
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  pin: { position: "absolute", top: 6, right: 8, fontSize: 12 },
  title: { fontSize: 16, fontWeight: "600", paddingRight: 16 },
  body: { fontSize: 14, lineHeight: 20 },
  items: { gap: 2 },
  struck: { textDecorationLine: "line-through" },
  more: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: "row", gap: 16, marginTop: 6 },
  action: { fontSize: 13, fontWeight: "600" },
});
