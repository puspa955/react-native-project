import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import BackgroundPopover from "@/components/BackgroundPopover";
import Checklist from "@/components/Checklist";
import DrawingCanvas from "@/components/DrawingCanvas";
import FormatBar from "@/components/FormatBar";
import Icon from "@/components/Icon";
import LabelPicker from "@/components/LabelPicker";
import NoteBackground from "@/components/NoteBackground";
import NoteChips from "@/components/NoteChips";
import NoteMedia, { mediaButtonStyle } from "@/components/NoteMedia";
import Popover, { PopoverItem } from "@/components/Popover";
import ReminderPicker from "@/components/ReminderPicker";
import RichBody from "@/components/RichBody";
import Tip from "@/components/Tip";
import { useTheme } from "@/hooks/useTheme";
import { pickImages } from "@/lib/images";
import { IS_WEB } from "@/lib/platform";
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
  const insets = useSafeAreaInsets();
  const note = useNotes((s) => s.notes.find((n) => n.id === noteId));
  const { update, togglePin, toggleType, duplicate } = useNotes.getState();
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false); // the "Background options" popover
  const paletteRef = useRef(null); // the button the popover opens next to
  const moreRef = useRef(null); // the ⋮ button the More popover opens next to
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
  // The full-page editor on the website has no on-screen keyboard to sit above, so ALL its buttons
  // go in the top row. Only in the phone app do font / background / photos sit at the bottom.
  const webPage = !card && IS_WEB;
  const appPage = !card && !IS_WEB;
  // Phone keyboard. On newer Android the window no longer shrinks when the keyboard opens, and
  // KeyboardAvoidingView misses it, so we measure it ourselves: when the keyboard shows, check how
  // far it reaches up into our screen (keyboardOverlap) and leave that much space at the bottom.
  // The bottom row (font, background, photos) then stays right above the keyboard.
  const screenRef = useRef(null); // fixed-size box around the editor, measured on the screen
  const [keyboardOverlap, setKeyboardOverlap] = useState(0);
  const keyboardOpen = keyboardOverlap > 0;
  useEffect(() => {
    if (Platform.OS === "web" || card) return;
    const ios = Platform.OS === "ios";
    const show = Keyboard.addListener(ios ? "keyboardWillShow" : "keyboardDidShow", (e) => {
      const keyboardTop = e.endCoordinates.screenY;
      // wait a moment, in case the window is resizing as well
      setTimeout(() => {
        screenRef.current?.measureInWindow((x, y, width, height) => {
          // The box is measured from the top of the app window and the keyboard from the very top
          // of the screen. On Android the window starts below the status bar, so shift the box
          // down by that difference (screen - window - bottom inset = the status bar height).
          // On iPhone both start at the top of the screen and the difference is 0.
          const windowTop = Math.max(
            0,
            Dimensions.get("screen").height - Dimensions.get("window").height - insets.bottom
          );
          const boxBottomOnScreen = windowTop + y + height;
          setKeyboardOverlap(Math.max(0, Math.round(boxBottomOnScreen - keyboardTop)));
        });
      }, 50);
    });
    const hide = Keyboard.addListener(ios ? "keyboardWillHide" : "keyboardDidHide", () =>
      setKeyboardOverlap(0)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [card, insets.bottom]);

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
  const empty = isEmptyNote(note); // nothing written yet, so there is nothing to archive
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

  // A soft round background behind every icon in the phone editor (the web card has none).
  const roundBg = card
    ? null
    : { backgroundColor: c.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.07)" };
  const btn = (extra) => [styles.iconBtn, roundBg, extra]; // "on" (yellow) comes last and wins

  // Each button is its own piece, so the phone editor can split them between the top and the
  // bottom of the screen. `place` is where tooltips (web only) should appear.
  const fontBtn = (place) =>
    !isList && (
      <Tip label="Formatting options" placement={place}>
        <Pressable
          onPress={() => setFormatOpen((v) => !v)}
          disabled={inTitle}
          hitSlop={8}
          style={btn([formatOpen && on, inTitle && styles.off])}
        >
          <Icon name="text-format" size={22} color={formatOpen ? c.text : c.muted} />
        </Pressable>
      </Tip>
    );
  const bellBtn = (place) => (
    <Tip label="Remind me" placement={place}>
      <Pressable
        onPress={() => setReminderOpen(true)}
        hitSlop={8}
        style={btn(!!note.reminder && on)}
      >
        <Icon name="notifications-none" size={22} color={note.reminder ? c.text : c.muted} />
      </Pressable>
    </Tip>
  );
  const paletteOn = paletteOpen || note.color !== "default" || !!note.background;
  const paletteBtn = (place) => (
    <Tip label="Background options" placement={place}>
      <Pressable
        ref={paletteRef}
        onPress={() => setPaletteOpen(true)}
        hitSlop={8}
        style={btn(paletteOn && on)}
      >
        <Icon name="palette" size={22} color={paletteOn ? c.text : c.muted} />
      </Pressable>
    </Tip>
  );
  const imageBtn = (place) => (
    <Tip label="Add image" placement={place}>
      <Pressable onPress={addImage} hitSlop={8} style={btn()}>
        <Icon name="image" size={22} color={c.muted} />
      </Pressable>
    </Tip>
  );
  const archiveBtn = (place) => (
    <Tip label={note.archived ? "Unarchive" : "Archive"} placement={place}>
      <Pressable
        onPress={() => {
          archiveNotes([note.id]);
          onClose();
        }}
        disabled={empty}
        hitSlop={8}
        style={btn(empty && styles.off)}
      >
        <Icon name={note.archived ? "unarchive" : "archive"} size={22} color={c.muted} />
      </Pressable>
    </Tip>
  );
  const moreBtn = (place) => (
    <Tip label="More" placement={place}>
      <Pressable ref={moreRef} onPress={() => setMoreOpen(true)} hitSlop={8} style={btn()}>
        <Icon name="more-vert" size={22} color={c.muted} />
      </Pressable>
    </Tip>
  );
  const pinBtn = (place) => (
    <Tip label={note.pinned ? "Unpin note" : "Pin note"} placement={place}>
      <Pressable onPress={() => togglePin(note.id)} hitSlop={8} style={btn(note.pinned && on)}>
        <Icon
          name={note.pinned ? "pin" : "pin-outline"}
          size={22}
          color={note.pinned ? c.text : c.muted}
        />
      </Pressable>
    </Tip>
  );

  // web card: all the small icons in one row (next to "Close")
  const actions = (
    <View style={styles.actions}>
      {fontBtn(tp)}
      {bellBtn(tp)}
      {paletteBtn(tp)}
      {imageBtn(tp)}
      {archiveBtn(tp)}
      {moreBtn(tp)}
    </View>
  );

  // On the web card, a note with pictures shows its pin in the top-right corner of the first
  // picture (next to that picture's delete button) instead of on the title row.
  const hasMedia = (note.images || []).length > 0 || (note.drawings || []).length > 0;
  const pinOnMedia = card && hasMedia;
  const mediaPin = pinOnMedia && (
    <Tip label={note.pinned ? "Unpin note" : "Pin note"} placement="bottom">
      <Pressable onPress={() => togglePin(note.id)} hitSlop={6} style={mediaButtonStyle}>
        <Icon name={note.pinned ? "pin" : "pin-outline"} size={16} color="#ffffff" />
      </Pressable>
    </Tip>
  );

  // a row of the "More" popover: closes it, then does the action
  const moreItem = (icon, label, onPress) => (
    <PopoverItem
      key={label}
      icon={icon}
      label={label}
      onPress={() => {
        setMoreOpen(false);
        onPress();
      }}
    />
  );

  const editor = (
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
            <Pressable onPress={onClose} hitSlop={8} style={btn()}>
              <Icon name="arrow-back" size={22} color={c.text} />
            </Pressable>
          </Tip>
          {webPage ? (
            <View style={[styles.actions, styles.actionsTight]}>
              {fontBtn("bottom")}
              {bellBtn("bottom")}
              {paletteBtn("bottom")}
              {imageBtn("bottom")}
              {pinBtn("bottom")}
              {archiveBtn("bottom")}
              {moreBtn("bottom")}
            </View>
          ) : (
            <View style={styles.actions}>
              {pinBtn("bottom")}
              {bellBtn("bottom")}
              {archiveBtn("bottom")}
              {moreBtn("bottom")}
            </View>
          )}
        </View>
      )}

      {/* website page: the formatting bar opens right under the buttons, not at the screen bottom */}
      {webPage && formatOpen && !isList && (
        <FormatBar fmt={currentFmt} onChange={formatLine} placement="bottom" />
      )}

      <ScrollView
        style={card ? styles.cardScroll : styles.flex}
        contentContainerStyle={card ? styles.cardContent : styles.pageContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          <NoteMedia note={note} editable onEditDrawing={(d) => setDrawing(d)} pin={mediaPin || null} />

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
            {card && !pinOnMedia && (
              <Tip label={note.pinned ? "Unpin note" : "Pin note"} placement={tp}>
                <Pressable onPress={() => togglePin(note.id)} hitSlop={8}>
                  <Icon
                    name={note.pinned ? "pin" : "pin-outline"}
                    size={22}
                    color={note.pinned ? c.text : c.muted}
                  />
                </Pressable>
              </Tip>
            )}
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
              // cards fit their text; only the full-screen phone editor keeps a tall tap area
              minHeight={card ? 0 : 300}
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

      {!webPage && formatOpen && !isList && (
        <FormatBar fmt={currentFmt} onChange={formatLine} placement="top" />
      )}

      {appPage && (
        <View style={[styles.pageBottom, { paddingBottom: keyboardOpen ? 10 : insets.bottom + 10 }]}>
          {fontBtn("top")}
          {paletteBtn("top")}
          {imageBtn("top")}
        </View>
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

      <Popover visible={moreOpen} anchorRef={moreRef} onClose={() => setMoreOpen(false)}>
        {/* an empty note has nothing to delete or copy, so those are left out; you can still draw */}
        {!empty &&
          moreItem("delete-outline", "Delete note", () => {
            trashNotes([note.id]);
            onClose();
          })}
        {moreItem("label-outline", "Add label", () => setLabelsOpen(true))}
        {moreItem("brush", "Add drawing", () => setDrawing({}))}
        {!empty && moreItem("content-copy", "Make a copy", makeCopy)}
        {moreItem("check-box", isList ? "Hide checkboxes" : "Show checkboxes", () =>
          toggleType(note.id)
        )}
      </Popover>

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

  // Phone editor: the space left at the bottom pushes the whole screen up above the keyboard. The
  // cards (web) don't need this.
  if (!card && Platform.OS !== "web") {
    return (
      <View ref={screenRef} collapsable={false} style={styles.flex}>
        <View style={[styles.flex, { paddingBottom: keyboardOverlap }]}>{editor}</View>
      </View>
    );
  }
  return editor;
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
  actionsTight: { gap: 5 }, // seven buttons plus the back arrow must fit a phone-width window
  // the phone editor's bottom row: font, background options, photos
  pageBottom: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 10 },
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
  missing: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  missingText: { fontSize: 16 },
  link: { fontWeight: "600" },
});
