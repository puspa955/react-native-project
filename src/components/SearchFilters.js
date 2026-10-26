import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "@/components/Icon";
import Tip from "@/components/Tip";
import { useTheme } from "@/hooks/useTheme";
import { FILTER_TYPES, useNotes } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";
import { NOTE_COLORS, noteBg } from "@/theme";

function Chip({ icon, label, selected, onPress }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={({ hovered }) => [
        styles.chip,
        { borderColor: selected ? c.primary : c.border },
        (selected || hovered) && { backgroundColor: selected ? c.active : c.hover },
      ]}
    >
      <Icon name={icon} size={18} color={selected ? c.text : c.muted} />
      <Text style={[styles.chipText, { color: c.text }]}>{label}</Text>
    </Pressable>
  );
}

function Section({ title, children }) {
  const c = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: c.muted }]}>{title}</Text>
      <View style={styles.row}>{children}</View>
    </View>
  );
}

// The search suggestions, like Google Keep: pick note Types, Colors and Labels to narrow the notes.
// Only filters that can match something are offered: a type nobody uses, a colour no note has, or
// a label no note carries is left out. (A filter that is already switched on always stays, so it
// can be switched off again.)
export function FilterPanel({ onPick }) {
  const c = useTheme();
  const filters = useSettings((s) => s.filters);
  const toggle = useSettings((s) => s.toggleFilter);
  const toggleFilter = (kind, value) => {
    toggle(kind, value);
    onPick?.(); // the caller can close the panel so it does not cover the results
  };
  const allLabels = useNotes((s) => s.labels);
  const notes = useNotes((s) => s.notes);

  const { types, colors, labels } = useMemo(() => {
    const live = notes.filter((n) => !n.trashedAt);
    return {
      types: FILTER_TYPES.filter(
        (t) => filters.types.includes(t.value) || live.some((n) => t.test(n))
      ),
      // a note with a background picture has no colour of its own to filter by
      colors: NOTE_COLORS.filter(
        (col) =>
          filters.colors.includes(col.key) ||
          live.some((n) => !n.background && n.color === col.key)
      ),
      labels: allLabels.filter(
        (l) => filters.labels.includes(l.id) || live.some((n) => (n.labels || []).includes(l.id))
      ),
    };
  }, [notes, allLabels, filters]);

  if (!types.length && !colors.length && !labels.length) {
    return (
      <View style={styles.panel}>
        <Text style={{ color: c.muted, fontSize: 14 }}>
          Nothing to filter by yet. Types, colors and labels appear here once your notes use them.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      {types.length > 0 && (
        <Section title="TYPES">
          {types.map((t) => (
            <Chip
              key={t.value}
              icon={t.icon}
              label={t.label}
              selected={filters.types.includes(t.value)}
              onPress={() => toggleFilter("types", t.value)}
            />
          ))}
        </Section>
      )}

      {colors.length > 0 && (
        <Section title="COLORS">
          {colors.map((col) => {
            const selected = filters.colors.includes(col.key);
            return (
              <Tip key={col.key} label={col.name}>
                <Pressable
                  onPress={() => toggleFilter("colors", col.key)}
                  accessibilityLabel={col.name}
                  style={[
                    styles.dot,
                    { backgroundColor: noteBg(col.key, c.dark), borderColor: c.border },
                    selected && { borderColor: c.primary, borderWidth: 2 },
                  ]}
                >
                  {selected && <Icon name="check" size={18} color={c.text} />}
                </Pressable>
              </Tip>
            );
          })}
        </Section>
      )}

      {labels.length > 0 && (
        <Section title="LABELS">
          {labels.map((l) => (
            <Chip
              key={l.id}
              icon="label-outline"
              label={l.name}
              selected={filters.labels.includes(l.id)}
              onPress={() => toggleFilter("labels", l.id)}
            />
          ))}
        </Section>
      )}
    </View>
  );
}

// The name of the filter that is picked ("Reminders", "Red", a label's name), or null.
export function usePickedFilterName() {
  const filters = useSettings((s) => s.filters);
  const labels = useNotes((s) => s.labels);
  if (filters.types.length) return FILTER_TYPES.find((t) => t.value === filters.types[0])?.label ?? null;
  if (filters.colors.length) return NOTE_COLORS.find((col) => col.key === filters.colors[0])?.name ?? null;
  if (filters.labels.length) return labels.find((l) => l.id === filters.labels[0])?.name ?? null;
  return null;
}

const styles = StyleSheet.create({
  panel: { padding: 16, gap: 18 },
  section: { gap: 10 },
  title: { fontSize: 11, fontWeight: "600", letterSpacing: 1 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  chipText: { fontSize: 14 },
  dot: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
