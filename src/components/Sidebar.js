import { usePathname, useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useNotes } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";
import { SIDEBAR_WIDTH } from "@/theme";

// Tabs shown in the bottom bar on narrow screens.
export const MOBILE_NAV = [
  { href: "/", label: "Notes", icon: "💡" },
  { href: "/reminders", label: "Reminders", icon: "⏰" },
  { href: "/labels", label: "Labels", icon: "🏷️" },
  { href: "/archive", label: "Archive", icon: "🗃️" },
  { href: "/trash", label: "Trash", icon: "🗑️" },
];

function Item({ icon, label, active, onPress }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [
        styles.item,
        hovered && { backgroundColor: c.hover },
        active && { backgroundColor: c.active },
      ]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          { color: active ? c.text : c.muted },
          active && styles.labelActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const labels = useNotes((s) => s.labels);
  const setLabelsModalOpen = useSettings((s) => s.setLabelsModalOpen);
  const sorted = useMemo(
    () => [...labels].sort((a, b) => a.name.localeCompare(b.name)),
    [labels]
  );
  const go = (href) => () => router.navigate(href);

  return (
    <ScrollView style={styles.sidebar}>
      <Item icon="💡" label="Notes" active={pathname === "/"} onPress={go("/")} />
      <Item
        icon="⏰"
        label="Reminders"
        active={pathname === "/reminders"}
        onPress={go("/reminders")}
      />
      {sorted.map((l) => (
        <Item
          key={l.id}
          icon="🏷️"
          label={l.name}
          active={pathname === `/label/${l.id}`}
          onPress={go(`/label/${l.id}`)}
        />
      ))}
      <Item
        icon="✏️"
        label={labels.length ? "Edit labels" : "Create new label"}
        onPress={() => setLabelsModalOpen(true)}
      />
      <Item icon="🗃️" label="Archive" active={pathname === "/archive"} onPress={go("/archive")} />
      <Item icon="🗑️" label="Trash" active={pathname === "/trash"} onPress={go("/trash")} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sidebar: { width: SIDEBAR_WIDTH, flexGrow: 0, paddingTop: 8, paddingRight: 12 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    height: 48,
    paddingLeft: 24,
    paddingRight: 12,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
  },
  icon: { fontSize: 18 },
  label: { fontSize: 14, flexShrink: 1 },
  labelActive: { fontWeight: "600" },
});
