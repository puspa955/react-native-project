import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "@/components/Icon";
import NoteBackground from "@/components/NoteBackground";
import NoteChips from "@/components/NoteChips";
import NoteMedia from "@/components/NoteMedia";
import Tip from "@/components/Tip";
import { useTheme } from "@/hooks/useTheme";
import { confirmDelete } from "@/lib/confirm";
import { pinNotes } from "@/lib/noteActions";
import { openNote } from "@/lib/openNote";
import { useNotes } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";
import { noteBg } from "@/theme";

const MAX_ITEMS = 8;

export default function NoteCard({ note, inTrash }) {
  const c = useTheme();
  const router = useRouter();
  const restore = useNotes((s) => s.restore);
  const remove = useNotes((s) => s.remove);
  const selected = useSettings((s) => s.selected.includes(note.id));
  const selecting = useSettings((s) => s.selected.length > 0);
  const toggleSelect = useSettings((s) => s.toggleSelect);
  // Hover is tracked with plain mouse events on the wrapper View. The card is a Pressable, and
  // react-native-web ends a Pressable's hover when an inner Pressable (pin / select) is hovered,
  // which made those buttons disappear right when the mouse reached them.
  const [hovered, setHovered] = useState(false);

  // While something is selected, tapping selects more instead of opening.
  const open = () => {
    if (inTrash) return;
    if (selecting) toggleSelect(note.id);
    else openNote(router, note.id);
  };

  const items = note.items || [];
  const shown = [...items.filter((i) => !i.done), ...items.filter((i) => i.done)].slice(
    0,
    MAX_ITEMS
  );

  return (
    <View
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={styles.wrap}
    >
      <Pressable
        onPress={open}
        onLongPress={inTrash ? undefined : () => toggleSelect(note.id)}
        style={[
          styles.card,
          { backgroundColor: noteBg(note.color, c.dark), borderColor: c.border },
          hovered && styles.hovered,
          selected && { borderColor: c.primary, borderWidth: 2, padding: 11 },
        ]}
      >
        <NoteBackground background={note.background} />
        <NoteMedia note={note} />
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
              <View key={i.id} style={styles.itemRow}>
                <Icon
                  name={i.done ? "check-box" : "check-box-outline-blank"}
                  size={16}
                  color={i.done ? c.muted : c.text}
                />
                <Text
                  numberOfLines={2}
                  style={[
                    styles.body,
                    styles.itemText,
                    { color: i.done ? c.muted : c.text },
                    i.done && styles.struck,
                  ]}
                >
                  {i.text}
                </Text>
              </View>
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

      {/* top-left check circle: shown on hover (web) or while selecting */}
      {!inTrash && (selected || hovered || selecting) && (
        <Tip label={selected ? "Deselect note" : "Select note"} style={styles.select}>
          <Pressable
            onPress={() => toggleSelect(note.id)}
            hitSlop={6}
            style={[styles.selectCircle, { backgroundColor: c.bg }]}
          >
            <Icon
              name={selected ? "check-circle" : "radio-button-unchecked"}
              size={20}
              color={selected ? c.primary : c.muted}
            />
          </Pressable>
        </Tip>
      )}
      {/* top-right pin: always shown when pinned, otherwise on hover (web) */}
      {!inTrash && (note.pinned || hovered) && (
        <Tip label={note.pinned ? "Unpin note" : "Pin note"} style={styles.pin}>
          <Pressable onPress={() => pinNotes([note.id])} hitSlop={6}>
            <Icon
              name={note.pinned ? "pin" : "pin-outline"}
              size={18}
              color={note.pinned ? c.text : c.muted}
            />
          </Pressable>
        </Tip>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  card: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 6, minHeight: 44, overflow: "hidden" },
  hovered: {
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  // sits on the card's top-left corner so it never covers the title
  select: { position: "absolute", top: -8, left: -8, zIndex: 2 },
  selectCircle: { borderRadius: 12 },
  pin: { position: "absolute", top: 6, right: 6, zIndex: 2 },
  title: { fontSize: 16, fontWeight: "600", paddingRight: 22 },
  body: { fontSize: 14, lineHeight: 20 },
  items: { gap: 2 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  itemText: { flex: 1 },
  struck: { textDecorationLine: "line-through" },
  more: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: "row", gap: 16, marginTop: 6 },
  action: { fontSize: 13, fontWeight: "600" },
});
