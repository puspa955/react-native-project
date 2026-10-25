import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Checklist from "@/components/Checklist";
import ColorPicker from "@/components/ColorPicker";
import Icon from "@/components/Icon";
import Tip from "@/components/Tip";
import LabelPicker from "@/components/LabelPicker";
import NoteChips from "@/components/NoteChips";
import ReminderPicker from "@/components/ReminderPicker";
import { useTheme } from "@/hooks/useTheme";
import { archiveNotes, trashNotes } from "@/lib/noteActions";
import { openNote } from "@/lib/openNote";
import { isEmptyNote, useNotes } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";
import { noteBg } from "@/theme";

const noOutline = Platform.select({ web: { outlineStyle: "none" }, default: {} });

// The note editor. variant "page": full screen with the buttons on top (phone).
// variant "dialog": a card with the buttons along the bottom and a Close button (desktop).
export default function NoteEditor({ noteId, onClose, variant = "page" }) {
  const c = useTheme();
  const router = useRouter();
  const note = useNotes((s) => s.notes.find((n) => n.id === noteId));
  const { update, togglePin, toggleType, duplicate } = useNotes.getState();
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const dialog = variant === "dialog";

  // Like Keep: leaving an empty note deletes it.
  useEffect(
    () => () => {
      const { notes, remove } = useNotes.getState();
      const n = notes.find((x) => x.id === noteId);
      if (n && isEmptyNote(n)) remove(noteId);
    },
    [noteId]
  );

  if (!note) {
    return (
      <View style={styles.missing}>
        <Text style={[styles.missingText, { color: c.muted }]}>
          This note doesn't exist.
        </Text>
        <Pressable onPress={onClose}>
          <Text style={[styles.link, { color: c.link }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const isList = note.type === "list";
  const dim = { opacity: 0.45 }; // "off" state for toggle buttons
  const size = dialog ? 22 : 24;
  const tp = dialog ? "top" : "bottom"; // dialog buttons sit at the bottom, so tips go above

  const makeCopy = () => {
    const copyId = duplicate(note.id);
    useSettings
      .getState()
      .showToast("Copy created", "Open", () => openNote(router, copyId));
  };

  const actions = (
    <View style={styles.actions}>
      <Tip label={isList ? "Hide checkboxes" : "Show checkboxes"} placement={tp}>
        <Pressable onPress={() => toggleType(note.id)} hitSlop={8} style={!isList && dim}>
          <Icon name="check-box" size={size} color={c.text} />
        </Pressable>
      </Tip>
      <Tip label="Add label" placement={tp}>
        <Pressable
          onPress={() => setLabelsOpen(true)}
          hitSlop={8}
          style={!(note.labels || []).length && dim}
        >
          <Icon name="label-outline" size={size} color={c.text} />
        </Pressable>
      </Tip>
      <Tip label="Remind me" placement={tp}>
        <Pressable
          onPress={() => setReminderOpen(true)}
          hitSlop={8}
          style={!note.reminder && dim}
        >
          <Icon name="notifications-none" size={size} color={c.text} />
        </Pressable>
      </Tip>
      <Tip label={note.pinned ? "Unpin note" : "Pin note"} placement={tp}>
        <Pressable onPress={() => togglePin(note.id)} hitSlop={8} style={!note.pinned && dim}>
          <Icon name={note.pinned ? "pin" : "pin-outline"} size={size} color={c.text} />
        </Pressable>
      </Tip>
      <Tip label="Make a copy" placement={tp}>
        <Pressable onPress={makeCopy} hitSlop={8}>
          <Icon name="content-copy" size={size - 2} color={c.text} />
        </Pressable>
      </Tip>
      <Tip label={note.archived ? "Unarchive" : "Archive"} placement={tp}>
        <Pressable
          onPress={() => {
            archiveNotes([note.id]);
            onClose();
          }}
          hitSlop={8}
        >
          <Icon name={note.archived ? "unarchive" : "archive"} size={size} color={c.text} />
        </Pressable>
      </Tip>
      <Tip label="Delete note" placement={tp}>
        <Pressable
          onPress={() => {
            trashNotes([note.id]);
            onClose();
          }}
          hitSlop={8}
        >
          <Icon name="delete-outline" size={size} color={c.text} />
        </Pressable>
      </Tip>
    </View>
  );

  return (
    <View
      style={[
        dialog ? styles.dialog : styles.page,
        { backgroundColor: noteBg(note.color, c.dark) },
      ]}
    >
      {!dialog && (
        <View style={styles.toolbar}>
          <Tip label="Back">
            <Pressable onPress={onClose} hitSlop={8}>
              <Icon name="arrow-back" size={24} color={c.text} />
            </Pressable>
          </Tip>
          {actions}
        </View>
      )}

      <ScrollView
        style={dialog ? styles.dialogScroll : styles.flex}
        contentContainerStyle={dialog ? styles.dialogContent : styles.pageContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          <TextInput
            value={note.title}
            onChangeText={(t) => update(note.id, { title: t })}
            placeholder="Title"
            placeholderTextColor={c.muted}
            autoFocus={isEmptyNote(note) && !isList}
            style={[styles.title, noOutline, { color: c.text }]}
          />
          {isList ? (
            // key: remount when converting so the checklist refs reset
            <Checklist
              key="list"
              items={note.items}
              onChange={(items) => update(note.id, { items })}
              focusFirst={isEmptyNote(note)}
            />
          ) : (
            <TextInput
              key="text"
              value={note.body}
              onChangeText={(t) => update(note.id, { body: t })}
              placeholder="Note"
              placeholderTextColor={c.muted}
              multiline
              style={[styles.body, dialog && styles.bodyDialog, noOutline, { color: c.text }]}
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

      {dialog && (
        <View style={styles.dialogBar}>
          {actions}
          <View style={styles.flex} />
          <Pressable onPress={onClose}>
            <Text style={[styles.close, { color: c.text }]}>Close</Text>
          </Pressable>
        </View>
      )}

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
  page: { flex: 1 },
  dialog: { width: "100%", maxHeight: "100%", borderRadius: 8, overflow: "hidden" },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 52,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 14 },
  pageContent: { alignItems: "center", flexGrow: 1, paddingHorizontal: 16 },
  dialogScroll: { flexGrow: 0, flexShrink: 1 },
  dialogContent: { padding: 16, paddingBottom: 4 },
  inner: { width: "100%", maxWidth: 700, gap: 8 },
  title: { fontSize: 22, fontWeight: "600", padding: 0 },
  body: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 300,
    padding: 0,
    textAlignVertical: "top",
  },
  bodyDialog: { minHeight: 120 },
  footer: { padding: 16, alignItems: "center" },
  dialogBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  close: { fontSize: 14, fontWeight: "600", padding: 4 },
  missing: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  missingText: { fontSize: 16 },
  link: { fontWeight: "600" },
});
