import { useLocalSearchParams, useRouter } from "expo-router";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import ColorPicker from "@/components/ColorPicker";
import { useNotes } from "@/store/notesStore";
import { colors, noteBg } from "@/theme";

const noOutline = Platform.select({ web: { outlineStyle: "none" }, default: {} });

export default function NoteEditor() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const note = useNotes((s) => s.notes.find((n) => n.id === id));
  const { update, togglePin, toggleArchive, trash } = useNotes.getState();

  // On web the editor can be opened directly by URL, so there may be no history to go back to.
  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

  if (!note) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>This note doesn't exist.</Text>
        <Pressable onPress={goBack}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: noteBg(note.color) }]}>
      <View style={styles.toolbar}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Text style={styles.tool}>←</Text>
        </Pressable>
        <View style={styles.toolbarRight}>
          <Pressable onPress={() => togglePin(note.id)} hitSlop={8}>
            <Text style={[styles.tool, !note.pinned && { opacity: 0.4 }]}>📌</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              toggleArchive(note.id);
              goBack();
            }}
            hitSlop={8}
          >
            <Text style={styles.tool}>{note.archived ? "📤" : "🗃️"}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              trash(note.id);
              goBack();
            }}
            hitSlop={8}
          >
            <Text style={styles.tool}>🗑️</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          <TextInput
            value={note.title}
            onChangeText={(t) => update(note.id, { title: t })}
            placeholder="Title"
            placeholderTextColor={colors.muted}
            style={[styles.title, noOutline]}
          />
          <TextInput
            value={note.body}
            onChangeText={(t) => update(note.id, { body: t })}
            placeholder="Note"
            placeholderTextColor={colors.muted}
            multiline
            style={[styles.body, noOutline]}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <ColorPicker value={note.color} onChange={(c) => update(note.id, { color: c })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1 },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 52,
  },
  toolbarRight: { flexDirection: "row", gap: 20 },
  tool: { fontSize: 20, color: colors.text },
  scroll: { alignItems: "center", flexGrow: 1, paddingHorizontal: 16 },
  inner: { width: "100%", maxWidth: 700, gap: 8 },
  title: { fontSize: 22, fontWeight: "600", color: colors.text, padding: 0 },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    minHeight: 300,
    padding: 0,
    textAlignVertical: "top",
  },
  footer: { padding: 16, alignItems: "center" },
  missing: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  missingText: { color: colors.muted, fontSize: 16 },
  link: { color: "#1a73e8", fontWeight: "600" },
});
