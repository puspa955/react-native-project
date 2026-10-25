import { ScrollView, StyleSheet, Text, View } from "react-native";
import NoteCard from "@/components/NoteCard";
import { useColumns } from "@/hooks/useColumns";
import { colors } from "@/theme";

// Round-robin masonry: note 0 -> col 0, note 1 -> col 1, ...
function Masonry({ notes, inTrash }) {
  const columns = useColumns();
  const cols = Array.from({ length: columns }, () => []);
  notes.forEach((n, i) => cols[i % columns].push(n));

  return (
    <View style={styles.masonry}>
      {cols.map((col, i) => (
        <View key={i} style={styles.column}>
          {col.map((n) => (
            <NoteCard key={n.id} note={n} inTrash={inTrash} />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function NotesGrid({
  notes,
  header,
  inTrash = false,
  groupPinned = false,
  emptyText,
}) {
  const pinned = groupPinned ? notes.filter((n) => n.pinned) : [];
  const others = groupPinned ? notes.filter((n) => !n.pinned) : notes;

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.inner}>
        {header}
        {notes.length === 0 && <Text style={styles.empty}>{emptyText}</Text>}
        {pinned.length > 0 && (
          <>
            <Text style={styles.label}>PINNED</Text>
            <Masonry notes={pinned} inTrash={inTrash} />
            {others.length > 0 && <Text style={styles.label}>OTHERS</Text>}
          </>
        )}
        {others.length > 0 && <Masonry notes={others} inTrash={inTrash} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, alignItems: "center", flexGrow: 1 },
  inner: { width: "100%", maxWidth: 1200 },
  masonry: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  column: { flex: 1, gap: 12 },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    color: colors.muted,
    marginTop: 16,
    marginBottom: 8,
  },
  empty: { textAlign: "center", color: colors.muted, marginTop: 48, fontSize: 16 },
});
