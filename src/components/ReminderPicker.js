import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Sheet from "@/components/Sheet";
import { useTheme } from "@/hooks/useTheme";
import { atHour, formatReminder, parseDateTime, toDateInput, toTimeInput } from "@/lib/format";
import { useNotes } from "@/store/notesStore";

const noOutline = Platform.select({ web: { outlineStyle: "none" }, default: {} });

function presets() {
  const now = new Date();
  const laterToday = now.getHours() < 17 ? atHour(0, 18) : Date.now() + 3 * 60 * 60 * 1000;
  return [
    { label: now.getHours() < 17 ? "Later today" : "In 3 hours", ts: laterToday },
    { label: "Tomorrow morning", ts: atHour(1, 8) },
    { label: "Next week", ts: atHour(7, 8) },
  ];
}

// "Remind me" dialog: quick presets, or type a date (YYYY-MM-DD) and a 24h time (HH:MM).
export default function ReminderPicker({ visible, onClose, noteId }) {
  const c = useTheme();
  const current = useNotes((s) => s.notes.find((n) => n.id === noteId)?.reminder);
  const setReminder = useNotes((s) => s.setReminder);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState("");

  // reset the form each time the dialog opens
  useEffect(() => {
    if (!visible) return;
    const start = current || atHour(1, 8);
    setDate(toDateInput(start));
    setTime(toTimeInput(start));
    setError("");
  }, [visible, current]);

  const save = (ts) => {
    setReminder(noteId, ts);
    onClose();
  };

  const saveCustom = () => {
    const ts = parseDateTime(date.trim(), time.trim());
    if (!ts) return setError("Use a date like 2026-10-26 and a time like 08:00");
    if (ts <= Date.now()) return setError("Pick a time in the future");
    save(ts);
  };

  const field = [styles.field, noOutline, { color: c.text, borderColor: c.border }];

  return (
    <Sheet visible={visible} onClose={onClose} title="Remind me">
      {presets().map((p) => (
        <Pressable
          key={p.label}
          onPress={() => save(p.ts)}
          style={({ hovered }) => [styles.preset, hovered && { backgroundColor: c.hover }]}
        >
          <Text style={{ color: c.text, fontSize: 15 }}>{p.label}</Text>
          <Text style={{ color: c.muted, fontSize: 13 }}>{formatReminder(p.ts)}</Text>
        </Pressable>
      ))}

      <Text style={[styles.label, { color: c.muted }]}>PICK DATE & TIME</Text>
      <View style={styles.inputs}>
        <TextInput
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={c.muted}
          style={[...field, { flex: 2 }]}
        />
        <TextInput
          value={time}
          onChangeText={setTime}
          placeholder="HH:MM"
          placeholderTextColor={c.muted}
          style={[...field, { flex: 1 }]}
        />
      </View>
      {!!error && <Text style={{ color: c.danger, fontSize: 13 }}>{error}</Text>}

      <View style={styles.footer}>
        {!!current && (
          <Pressable onPress={() => save(null)}>
            <Text style={{ color: c.danger, fontWeight: "600", padding: 4 }}>Remove</Text>
          </Pressable>
        )}
        <View style={{ flex: 1 }} />
        <Pressable onPress={onClose}>
          <Text style={{ color: c.muted, fontWeight: "600", padding: 4 }}>Cancel</Text>
        </Pressable>
        <Pressable onPress={saveCustom}>
          <Text style={{ color: c.link, fontWeight: "600", padding: 4 }}>Save</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  preset: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  label: { fontSize: 11, fontWeight: "600", letterSpacing: 1, marginTop: 4 },
  inputs: { flexDirection: "row", gap: 8 },
  field: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
  },
  footer: { flexDirection: "row", alignItems: "center", gap: 12 },
});
