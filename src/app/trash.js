import { Pressable, StyleSheet, Text, View } from "react-native";
import NotesGrid from "@/components/NotesGrid";
import { useTheme } from "@/hooks/useTheme";
import { confirmDelete } from "@/lib/confirm";
import { useNoteList, useNotes } from "@/store/notesStore";

export default function TrashScreen() {
  const c = useTheme();
  const notes = useNoteList("trash");
  const emptyTrash = useNotes((s) => s.emptyTrash);

  const header = notes.length > 0 && (
    <View style={styles.banner}>
      <Text style={[styles.bannerText, { color: c.muted }]}>
        Notes in Trash are deleted after 7 days.
      </Text>
      <Pressable
        onPress={() =>
          confirmDelete("Empty Trash?", "All notes will be deleted forever.", emptyTrash)
        }
      >
        <Text style={[styles.empty, { color: c.link }]}>Empty Trash</Text>
      </Pressable>
    </View>
  );

  return <NotesGrid notes={notes} inTrash header={header} emptyText="No notes in Trash" />;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  bannerText: { fontSize: 14 },
  empty: { fontSize: 14, fontWeight: "600" },
});
