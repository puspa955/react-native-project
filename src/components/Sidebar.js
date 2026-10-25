import { usePathname, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Icon from "@/components/Icon";
import { useTheme } from "@/hooks/useTheme";
import { useNotes } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";
import { RAIL_WIDTH, SIDEBAR_WIDTH } from "@/theme";

// compact = icon only (the collapsed strip)
function Item({ icon, label, active, onPress, compact }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={({ hovered }) => [
        compact ? styles.itemCompact : styles.item,
        hovered && { backgroundColor: c.hover },
        active && { backgroundColor: c.active },
      ]}
    >
      <Icon name={icon} size={22} color={active ? c.text : c.muted} />
      {!compact && (
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
      )}
    </Pressable>
  );
}

// Notes / Reminders / labels / Edit labels / Archive / Trash.
// Wide screens: permanent, and `collapsed` shrinks it to an icon strip that expands over the
// notes while the mouse is on it. Phones: shown inside the drawer (onNavigate closes it).
export default function Sidebar({ onNavigate, style, collapsed = false }) {
  const c = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const labels = useNotes((s) => s.labels);
  const setLabelsModalOpen = useSettings((s) => s.setLabelsModalOpen);
  const [hover, setHover] = useState(false);
  const compact = collapsed && !hover;
  const sorted = useMemo(
    () => [...labels].sort((a, b) => a.name.localeCompare(b.name)),
    [labels]
  );
  const go = (href) => () => {
    router.navigate(href);
    onNavigate?.();
  };

  const list = (
    <ScrollView
      style={[styles.sidebar, compact && styles.sidebarCompact, collapsed && hover && styles.fill, style]}
      contentContainerStyle={compact && styles.compactContent}
    >
      <Item
        compact={compact}
        icon="lightbulb-outline"
        label="Notes"
        active={pathname === "/"}
        onPress={go("/")}
      />
      <Item
        compact={compact}
        icon="notifications-none"
        label="Reminders"
        active={pathname === "/reminders"}
        onPress={go("/reminders")}
      />
      {sorted.map((l) => (
        <Item
          compact={compact}
          key={l.id}
          icon="label-outline"
          label={l.name}
          active={pathname === `/label/${l.id}`}
          onPress={go(`/label/${l.id}`)}
        />
      ))}
      <Item
        compact={compact}
        icon="edit"
        label={labels.length ? "Edit labels" : "Create new label"}
        onPress={() => {
          onNavigate?.();
          setLabelsModalOpen(true);
        }}
      />
      <Item
        compact={compact}
        icon="archive"
        label="Archive"
        active={pathname === "/archive"}
        onPress={go("/archive")}
      />
      <Item
        compact={compact}
        icon="delete-outline"
        label="Trash"
        active={pathname === "/trash"}
        onPress={go("/trash")}
      />
    </ScrollView>
  );

  if (!collapsed) return list;

  // Collapsed: keep a 72px strip in the layout; on hover the full list floats over the notes.
  return (
    // plain DOM mouse events on a View: a Pressable's hover would end as soon as an item
    // (an inner Pressable) is hovered, which made the sidebar flicker open and closed.
    <View
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={styles.rail}
    >
      <View
        style={[
          styles.railInner,
          hover && [styles.overlay, { backgroundColor: c.bg, borderRightColor: c.border }],
        ]}
      >
        {list}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: { width: SIDEBAR_WIDTH, flexGrow: 0, paddingTop: 8, paddingRight: 12 },
  sidebarCompact: { width: RAIL_WIDTH, paddingRight: 0 },
  fill: { width: SIDEBAR_WIDTH, paddingRight: 12 },
  compactContent: { alignItems: "center" },
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
  itemCompact: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 14, flexShrink: 1 },
  labelActive: { fontWeight: "600" },
  rail: { width: RAIL_WIDTH, zIndex: 30 },
  railInner: { flex: 1 },
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 2, height: 0 },
    elevation: 12,
  },
});
