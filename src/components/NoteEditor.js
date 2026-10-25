import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import BackgroundPopover from "@/components/BackgroundPopover";
import Checklist from "@/components/Checklist";
import DrawingCanvas from "@/components/DrawingCanvas";
import FormatBar from "@/components/FormatBar";
import Icon from "@/components/Icon";
import LabelPicker from "@/components/LabelPicker";
import NoteBackground from "@/components/NoteBackground";
import NoteChips from "@/components/NoteChips";
import NoteMedia from "@/components/NoteMedia";
import ReminderPicker from "@/components/ReminderPicker";
import RichBody from "@/components/RichBody";
import Sheet from "@/components/Sheet";
import Tip from "@/components/Tip";
import { useTheme } from "@/hooks/useTheme";
import { pickImages } from "@/lib/images";
import { splitBody } from "@/lib/richText";
import { archiveNotes, trashNotes } from "@/lib/noteActions";
import { openNote } from "@/lib/openNote";
import { isEmptyNote, useNotes } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";
import { noteBg } from "@/theme";

const noOutline = Platform.select({ web: { outlineStyle: "none" }, default: {} });

// The note editor, in three shapes:
//   "page"   full screen, buttons along the top (phone app)
//   "dialog" a card in a dialog over the notes (web)
//   "inline" the same card, right in the page (the web "Take a note..." bar when expanded)
// Cards have the buttons in one row along the bottom, with "Close" at the end of that row.
export default function NoteEditor({ noteId, onClose, variant = "page" }) {
  const c = useTheme();
  const router = useRouter();
  const note = useNotes((s) => s.notes.find((n) => n.id === noteId));
  const { update, togglePin, toggleType, duplicate } = useNotes.getState();
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false); // the "Background options" popover
  const paletteRef = useRef(null); // the button the popover opens next to
  const [formatOpen, setFormatOpen] = useState(false); // the "Aa" formatting bar
  const [focusedLine, setFocusedLine] = useState(0); // the line the formatting bar changes
  // Where the cursor was last. Formatting only applies to the note's text, so while the cursor is in
  // the title the bar is closed and the "Aa" button is greyed out. (Set on focus only: pressing a
  // bar button blurs the text field, which must not count as leaving it.)
  const [cursorIn, setCursorIn] = useState("body");
  const inTitle = cursorIn === "title";
  // the drawing canvas: closed, or open on a new drawing ({}) or an existing one
  const [drawing, setDrawing] = useState(null);
  const card = variant !== "page";

  const addImage = async () => {
    const result = await pickImages();
    if (result.error) useSettings.getState().showToast(result.error);
    else if (result.images.length) useNotes.getState().addImages(noteId, result.images);
  };

  // "New note with an image / drawing" shortcuts set this before opening the editor
  useEffect(() => {
    const { pending, setPending } = useSettings.getState();
    if (!pending || pending.noteId !== noteId) return;
    setPending(null);
    if (pending.action === "image") addImage();
    else if (pending.action === "draw") setDrawing({});
  }, [noteId]);

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
  const on = { backgroundColor: c.active }; // highlight behind a toggle button that is switched on
  const tp = card ? "top" : "bottom"; // card buttons sit at the bottom, so tooltips go above them

  const makeCopy = () => {
    const copyId = duplicate(note.id);
    useSettings
      .getState()
      .showToast("Copy created", "Open", () => openNote(router, copyId));
  };

  // change the look of the line the cursor is on
  const formatLine = (patch) => {
    const { lines, fmts } = splitBody(note);
    const i = Math.min(focusedLine, lines.length - 1);
    fmts[i] = { ...fmts[i], ...patch };
    update(note.id, { lineFormats: fmts });
  };
  const currentFmt = (() => {
    const { lines, fmts } = splitBody(note);
    return fmts[Math.min(focusedLine, lines.length - 1)];
  })();

  // the row of small icons
  const actions = (
    <View style={styles.actions}>
      {!isList && (
        <Tip label="Formatting options" placement={tp}>
          <Pressable
            onPress={() => setFormatOpen((v) => !v)}
            disabled={inTitle}
            hitSlop={8}
            style={[styles.iconBtn, formatOpen && on, inTitle && styles.off]}
          >
            <Icon name="text-format" size={22} color={formatOpen ? c.text : c.muted} />
          </Pressable>
        </Tip>
      )}
      <Tip label="Remind me" placement={tp}>
        <Pressable
          onPress={() => setReminderOpen(true)}
          hitSlop={8}
          style={[styles.iconBtn, !!note.reminder && on]}
        >
          <Icon name="notifications-none" size={22} color={note.reminder ? c.text : c.muted} />
        </Pressable>
      </Tip>
      <Tip label="Background options" placement={tp}>
        <Pressable
          ref={paletteRef}
          onPress={() => setPaletteOpen(true)}
          hitSlop={8}
          style={[styles.iconBtn, (paletteOpen || note.color !== "default" || !!note.background) && on]}
        >
          <Icon
            name="palette"
            size={22}
            color={paletteOpen || note.color !== "default" || note.background ? c.text : c.muted}
          />
        </Pressable>
      </Tip>
      <Tip label="Add image" placement={tp}>
        <Pressable onPress={addImage} hitSlop={8} style={styles.iconBtn}>
          <Icon name="image" size={22} color={c.muted} />
        </Pressable>
      </Tip>
      <Tip label={note.archived ? "Unarchive" : "Archive"} placement={tp}>
        <Pressable
          onPress={() => {
            archiveNotes([note.id]);
            onClose();
          }}
          hitSlop={8}
          style={styles.iconBtn}
        >
          <Icon name={note.archived ? "unarchive" : "archive"} size={22} color={c.muted} />
        </Pressable>
      </Tip>
      <Tip label="More" placement={tp}>
        <Pressable onPress={() => setMoreOpen(true)} hitSlop={8} style={styles.iconBtn}>
          <Icon name="more-vert" size={22} color={c.muted} />
        </Pressable>
      </Tip>
    </View>
  );

  // the "More" menu
  const moreItem = (icon, label, onPress) => (
    <Pressable
      key={label}
      onPress={() => {
        setMoreOpen(false);
        onPress();
      }}
      style={({ hovered }) => [styles.moreItem, hovered && { backgroundColor: c.hover }]}
    >
      <Icon name={icon} size={22} color={c.muted} />
      <Text style={{ color: c.text, fontSize: 15 }}>{label}</Text>
    </Pressable>
  );

  return (
    <View
      style={[
        variant === "page" ? styles.page : styles.card,
        variant === "inline" && [styles.inline, { borderColor: c.border }],
        { backgroundColor: noteBg(note.color, c.dark) },
      ]}
    >
      <NoteBackground background={note.background} />

      {!card && (
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
        style={card ? styles.cardScroll : styles.flex}
        contentContainerStyle={card ? styles.cardContent : styles.pageContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          <NoteMedia note={note} editable onEditDrawing={(d) => setDrawing(d)} />

          {/* title, with the pin at its right end */}
          <View style={styles.titleRow}>
            <TextInput
              value={note.title}
              onChangeText={(t) => update(note.id, { title: t })}
              placeholder="Title"
              placeholderTextColor={c.muted}
              autoFocus={isEmptyNote(note) && !isList}
              onFocus={() => {
                setCursorIn("title");
                setFormatOpen(false);
              }}
              style={[styles.title, noOutline, { color: c.text }]}
            />
            <Tip label={note.pinned ? "Unpin note" : "Pin note"} placement={tp}>
              <Pressable onPress={() => togglePin(note.id)} hitSlop={8}>
                <Icon
                  name={note.pinned ? "pin" : "pin-outline"}
                  size={22}
                  color={note.pinned ? c.text : c.muted}
                />
              </Pressable>
            </Tip>
          </View>

          {isList ? (
            // key: remount when converting so the checklist refs reset
            <Checklist
              key="list"
              items={note.items}
              onChange={(items) => update(note.id, { items })}
              focusFirst={isEmptyNote(note)}
            />
          ) : (
            <RichBody
              key="text"
              note={note}
              minHeight={card ? 90 : 300}
              onFocusLine={(i) => {
                setFocusedLine(i);
                setCursorIn("body");
              }}
            />
          )}
          <NoteChips
            note={note}
            onPressReminder={() => setReminderOpen(true)}
            onPressLabels={() => setLabelsOpen(true)}
          />
        </View>
      </ScrollView>

      {formatOpen && !isList && (
        <FormatBar fmt={currentFmt} onChange={formatLine} placement={card ? "top" : "bottom"} />
      )}

      {card && (
        <View style={styles.bar}>
          {actions}
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={[styles.close, { color: c.text }]}>Close</Text>
          </Pressable>
        </View>
      )}

      <BackgroundPopover
        visible={paletteOpen}
        anchorRef={paletteRef}
        note={note}
        onClose={() => setPaletteOpen(false)}
      />

      <Sheet visible={moreOpen} onClose={() => setMoreOpen(false)}>
        {moreItem("delete-outline", "Delete note", () => {
          trashNotes([note.id]);
          onClose();
        })}
        {moreItem("label-outline", "Add label", () => setLabelsOpen(true))}
        {moreItem("brush", "Add drawing", () => setDrawing({}))}
        {moreItem("content-copy", "Make a copy", makeCopy)}
        {moreItem("check-box", isList ? "Hide checkboxes" : "Show checkboxes", () =>
          toggleType(note.id)
        )}
      </Sheet>

      <DrawingCanvas
        visible={!!drawing}
        initial={drawing && drawing.id ? drawing : null}
        onClose={() => setDrawing(null)}
        onSave={(result) => {
          const { saveDrawing, removeDrawing } = useNotes.getState();
          if (result) saveDrawing(note.id, result);
          else if (drawing && drawing.id) removeDrawing(note.id, drawing.id);
          setDrawing(null);
        }}
      />

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
  card: { width: "100%", maxHeight: "100%", borderRadius: 8, overflow: "hidden" },
  inline: {
    maxWidth: 600,
    alignSelf: "center",
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 52,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  pageContent: { alignItems: "center", flexGrow: 1, paddingHorizontal: 16 },
  cardScroll: { flexGrow: 0, flexShrink: 1 },
  cardContent: { padding: 16, paddingBottom: 4 },
  inner: { width: "100%", maxWidth: 700, gap: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { flex: 1, fontSize: 22, fontWeight: "600", padding: 0 },
  body: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 300,
    padding: 0,
    textAlignVertical: "top",
  },
  bodyCard: { minHeight: 90 },
  off: { opacity: 0.2 }, // a button that can't be used right now
  // the icons and "Close" share one row; "Close" drops to its own row only if there is no room
  bar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    rowGap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  closeBtn: { marginLeft: "auto" },
  close: { fontSize: 14, fontWeight: "600", padding: 4 },
  moreItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  missing: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  missingText: { fontSize: 16 },
  link: { fontWeight: "600" },
});
