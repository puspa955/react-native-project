import { Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "@/components/Icon";
import { useOverdue } from "@/hooks/useOverdue";
import { useTheme } from "@/hooks/useTheme";
import { formatReminder } from "@/lib/format";
import { useNotes } from "@/store/notesStore";

const MAX_LABELS_ON_CARD = 3;

// Reminder + label chips. Pass onPressReminder / onPressLabels to make them tappable (editor).
export default function NoteChips({ note, onPressReminder, onPressLabels }) {
  const c = useTheme();
  const allLabels = useNotes((s) => s.labels);
  const labels = allLabels.filter((l) => (note.labels || []).includes(l.id));
  const shown = onPressLabels ? labels : labels.slice(0, MAX_LABELS_ON_CARD);
  const hidden = labels.length - shown.length;
  const overdue = useOverdue(note.reminder);

  if (!note.reminder && labels.length === 0) return null;

  const chip = { borderColor: c.border };

  return (
    <View style={styles.row}>
      {!!note.reminder && (
        <Pressable
          onPress={onPressReminder}
          disabled={!onPressReminder}
          style={[styles.chip, styles.reminder, chip]}
        >
          <Icon
            name="notifications-none"
            size={13}
            color={overdue ? c.danger : c.text}
          />
          <Text
            style={[
              styles.text,
              { color: overdue ? c.danger : c.text },
              overdue && styles.overdue,
            ]}
          >
            {formatReminder(note.reminder)}
          </Text>
        </Pressable>
      )}
      {shown.map((l) => (
        <Pressable
          key={l.id}
          onPress={onPressLabels}
          disabled={!onPressLabels}
          style={[styles.chip, chip]}
        >
          <Text style={[styles.text, { color: c.text }]} numberOfLines={1}>
            {l.name}
          </Text>
        </Pressable>
      ))}
      {hidden > 0 && (
        <View style={[styles.chip, chip]}>
          <Text style={[styles.text, { color: c.muted }]}>+{hidden}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  chip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    maxWidth: "100%",
  },
  reminder: { flexDirection: "row", alignItems: "center", gap: 4 },
  text: { fontSize: 12 },
  overdue: { textDecorationLine: "line-through" },
});
