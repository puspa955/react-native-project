import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Checklist from "@/components/Checklist";
import ColorPicker from "@/components/ColorPicker";
import LabelPicker from "@/components/LabelPicker";
import NoteChips from "@/components/NoteChips";
import ReminderPicker from "@/components/ReminderPicker";
import { useTheme } from "@/hooks/useTheme";
import { isEmptyNote, useNotes } from "@/store/notesStore";
import { noteBg } from "@/theme";

const noOutline = Platform.select({ web: { outlineStyle: "none" }, default: {} });

export default function NoteEditor() {
  const c = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const note = useNotes((s) => s.notes.find((n) => n.id === id));
  const { update, togglePin, toggleArchive, toggleType, trash } = useNotes.getState();
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);

  // Like Keep: leaving an empty note deletes it.
  useEffect(
    () => () => {
      const { notes, remove } = useNotes.getState();
      const n = notes.find((x) => x.id === id);
      if (n && isEmptyNote(n)) remove(id);
    },
    [id]
  );

  // On web the editor can be opened directly by URL, so there may be no history to go back to.
  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

  if (!note) {
    return (
      <View style={styles.missing}>
        <Text style={[styles.missingText, { color: c.muted }]}>
          This note doesn't exist.
        </Text>
        <Pressable onPress={goBack}>
          <Text style={[styles.link, { color: c.link }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const isList = note.type === "list";

  return (
    <View style={[styles.screen, { backgroundColor: noteBg(note.color, c.dark) }]}>
      <View style={styles.toolbar}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Text style={[styles.tool, { color: c.text }]}>←</Text>
        </Pressable>
        <View style={styles.toolbarRight}>
          <Pressable onPress={() => toggleType(note.id)} hitSlop={8}>
            <Text style={[styles.tool, { color: c.text }, !isList && { opacity: 0.4 }]}>
              ☑
            </Text>
          </Pressable>
          <Pressable onPress={() => setLabelsOpen(true)} hitSlop={8}>
            <Text
              style={[styles.tool, !(note.labels || []).length && { opacity: 0.4 }]}
            >
              🏷️
            </Text>
          </Pressable>
          <Pressable onPress={() => setReminderOpen(true)} hitSlop={8}>
            <Text style={[styles.tool, !note.reminder && { opacity: 0.4 }]}>⏰</Text>
          </Pressable>
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
            placeholderTextColor={c.muted}
            style={[styles.title, noOutline, { color: c.text }]}
          />
          {isList ? (
            // key: remount when converting so the checklist refs reset
            <Checklist
              key="list"
              items={note.items}
              onChange={(items) => update(note.id, { items })}
            />
          ) : (
            <TextInput
              key="text"
              value={note.body}
              onChangeText={(t) => update(note.id, { body: t })}
              placeholder="Note"
              placeholderTextColor={c.muted}
              multiline
              style={[styles.body, noOutline, { color: c.text }]}
            />
          )}
          <NoteChips
            note={note}
            onPressReminder={() => setReminderOpen(true)}
            onPressLabels={() => setLabelsOpen(true)}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <ColorPicker value={note.color} onChange={(col) => update(note.id, { color: col })} />
      </View>

      <LabelPicker visible={labelsOpen} onClose={() => setLabelsOpen(false)} noteId={note.id} />
      <ReminderPicker
        visible={reminderOpen}
        onClose={() => setReminderOpen(false)}
        noteId={note.id}
      />
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
  toolbarRight: { flexDirection: "row", gap: 16 },
  tool: { fontSize: 20 },
  scroll: { alignItems: "center", flexGrow: 1, paddingHorizontal: 16 },
  inner: { width: "100%", maxWidth: 700, gap: 8 },
  title: { fontSize: 22, fontWeight: "600", padding: 0 },
  body: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 300,
    padding: 0,
    textAlignVertical: "top",
  },
  footer: { padding: 16, alignItems: "center" },
  missing: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  missingText: { fontSize: 16 },
  link: { fontWeight: "600" },
});
