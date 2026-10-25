import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useNotes } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";

// Mobile has no sidebar, so this screen is the way to reach labels.
export default function LabelsScreen() {
  const c = useTheme();
  const router = useRouter();
  const labels = useNotes((s) => s.labels);
  const setLabelsModalOpen = useSettings((s) => s.setLabelsModalOpen);
  const sorted = useMemo(
    () => [...labels].sort((a, b) => a.name.localeCompare(b.name)),
    [labels]
  );

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {sorted.map((l) => (
        <Pressable
          key={l.id}
          onPress={() => router.push(`/label/${l.id}`)}
          style={({ hovered }) => [styles.row, hovered && { backgroundColor: c.hover }]}
        >
          <Text style={styles.icon}>🏷️</Text>
          <Text style={[styles.name, { color: c.text }]}>{l.name}</Text>
        </Pressable>
      ))}
      {sorted.length === 0 && (
        <Text style={[styles.empty, { color: c.muted }]}>No labels yet</Text>
      )}
      <Pressable onPress={() => setLabelsModalOpen(true)} style={styles.row}>
        <Text style={styles.icon}>✏️</Text>
        <Text style={[styles.name, { color: c.link }]}>
          {sorted.length ? "Edit labels" : "Create new label"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    minHeight: 52,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  icon: { fontSize: 18 },
  name: { fontSize: 16 },
  empty: { textAlign: "center", marginVertical: 32, fontSize: 16 },
});
