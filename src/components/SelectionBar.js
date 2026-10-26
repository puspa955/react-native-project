import { usePathname } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import BackgroundPopover from "@/components/BackgroundPopover";
import Icon from "@/components/Icon";
import LabelPicker from "@/components/LabelPicker";
import Popover, { PopoverItem } from "@/components/Popover";
import ReminderPicker from "@/components/ReminderPicker";
import Tip from "@/components/Tip";
import { useTheme } from "@/hooks/useTheme";
import { archiveNotes, copyNotes, pinNotes, trashNotes } from "@/lib/noteActions";
import { useNotes } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";

// Replaces the header while notes are selected. Everything here acts on ALL selected notes:
// pin, remind me, background options, archive, and a "More" menu (delete, add label, make a copy).
export default function SelectionBar() {
  const c = useTheme();
  const pathname = usePathname();
  const selected = useSettings((s) => s.selected);
  const clearSelection = useSettings((s) => s.clearSelection);
  // the first selected note stands in for the group when a picker shows "what is chosen now"
  const first = useNotes((s) => s.notes.find((n) => n.id === selected[0]));
  // true when every selected note is already pinned, so the button then offers "Unpin note"
  const allPinned = useNotes(
    (s) => selected.length > 0 && selected.every((id) => s.notes.find((n) => n.id === id)?.pinned)
  );
  const [reminderOpen, setReminderOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const paletteRef = useRef(null);
  const moreRef = useRef(null); // the ⋮ button the More popover opens next to

  // these actions are finished once done, so they also leave selection mode
  const run = (action) => () => {
    action(selected);
    clearSelection();
  };

  const iconButton = (label, name, onPress, ref) => (
    <Tip label={label}>
      <Pressable ref={ref} onPress={onPress} hitSlop={8} accessibilityLabel={label}>
        <Icon name={name} size={24} color={c.text} />
      </Pressable>
    </Tip>
  );

  // a row of the More popover: closes it, then does the action
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

  return (
    <View style={[styles.bar, { borderBottomColor: c.border, backgroundColor: c.active }]}>
      <Tip label="Clear selection">
        <Pressable onPress={clearSelection} hitSlop={8}>
          <Icon name="close" size={24} color={c.text} />
        </Pressable>
      </Tip>
      <Text style={[styles.count, { color: c.text }]}>{selected.length}</Text>
      <View style={styles.flex} />

      {iconButton(
        allPinned ? "Unpin note" : "Pin note",
        allPinned ? "pin" : "pin-outline",
        run(pinNotes)
      )}
      {iconButton("Remind me", "notifications-none", () => setReminderOpen(true))}
      {iconButton("Background options", "palette", () => setPaletteOpen(true), paletteRef)}
      {iconButton(
        pathname === "/archive" ? "Unarchive" : "Archive",
        pathname === "/archive" ? "unarchive" : "archive",
        run(archiveNotes)
      )}
      {iconButton("More", "more-vert", () => setMoreOpen(true), moreRef)}

      <Popover visible={moreOpen} anchorRef={moreRef} onClose={() => setMoreOpen(false)}>
        {moreItem("delete-outline", "Delete note", run(trashNotes))}
        {moreItem("label-outline", "Add label", () => setLabelsOpen(true))}
        {moreItem("content-copy", "Make a copy", run(copyNotes))}
      </Popover>

      <ReminderPicker
        visible={reminderOpen}
        onClose={() => setReminderOpen(false)}
        noteIds={selected}
        onDone={clearSelection}
      />
      <LabelPicker visible={labelsOpen} onClose={() => setLabelsOpen(false)} noteIds={selected} />
      {first && (
        <BackgroundPopover
          visible={paletteOpen}
          anchorRef={paletteRef}
          note={first}
          noteIds={selected}
          onClose={() => setPaletteOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    zIndex: 10, // so tooltips drawn below the bar stay on top of the notes
  },
  count: { fontSize: 18, fontWeight: "600" },
});
