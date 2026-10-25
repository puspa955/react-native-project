import { ScrollView, StyleSheet, Text, View } from "react-native";
import Icon from "@/components/Icon";
import NoteCard from "@/components/NoteCard";
import { useColumns } from "@/hooks/useColumns";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/store/settingsStore";

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
  emptyIcon,
}) {
  const c = useTheme();
  const listLayout = useSettings((s) => s.layout === "list");
  const pinned = groupPinned ? notes.filter((n) => n.pinned) : [];
  const others = groupPinned ? notes.filter((n) => !n.pinned) : notes;

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.inner, listLayout && styles.innerList]}>
        {header}
        {notes.length === 0 && (
          <View style={styles.empty}>
            {!!emptyIcon && <Icon name={emptyIcon} size={96} color={c.border} />}
            <Text style={[styles.emptyText, { color: c.muted }]}>{emptyText}</Text>
          </View>
        )}
        {pinned.length > 0 && (
          <>
            <Text style={[styles.label, { color: c.muted }]}>PINNED</Text>
            <Masonry notes={pinned} inTrash={inTrash} />
            {others.length > 0 && (
              <Text style={[styles.label, { color: c.muted }]}>OTHERS</Text>
            )}
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
  innerList: { maxWidth: 600 },
  masonry: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  column: { flex: 1, gap: 12 },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  empty: { alignItems: "center", gap: 16, marginTop: 48 },
  emptyText: { textAlign: "center", fontSize: 16 },
});
