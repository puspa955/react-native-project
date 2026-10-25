import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "@/components/Icon";
import Sheet from "@/components/Sheet";
import Tip from "@/components/Tip";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/store/settingsStore";

// Header gear button. Opens a small menu: Settings, and a quick dark theme switch (like Keep).
export function SettingsButton() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const setSettingsOpen = useSettings((s) => s.setSettingsOpen);
  const [open, setOpen] = useState(false);

  const item = (label, onPress) => (
    <Pressable
      onPress={() => {
        setOpen(false);
        onPress();
      }}
      style={({ hovered }) => [styles.item, hovered && { backgroundColor: c.hover }]}
    >
      <Text style={{ color: c.text, fontSize: 14 }}>{label}</Text>
    </Pressable>
  );

  return (
    <>
      <Tip label="Settings">
        <Pressable onPress={() => setOpen(true)} hitSlop={8}>
          <Icon name="settings" size={24} color={c.muted} />
        </Pressable>
      </Tip>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            onPress={() => {}}
            style={[
              styles.menu,
              { top: insets.top + 52, backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            {item("Settings", () => setSettingsOpen(true))}
            {item(c.dark ? "Disable dark theme" : "Enable dark theme", c.toggle)}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const OPTIONS = [
  { value: "system", label: "Same as device" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

// "Settings" dialog: pick the theme.
export function SettingsDialog() {
  const c = useTheme();
  const open = useSettings((s) => s.settingsOpen);
  const setOpen = useSettings((s) => s.setSettingsOpen);
  const mode = useSettings((s) => s.mode);
  const setMode = useSettings((s) => s.setMode);

  return (
    <Sheet visible={open} onClose={() => setOpen(false)} title="Settings">
      <Text style={[styles.section, { color: c.muted }]}>THEME</Text>
      {OPTIONS.map((o) => (
        <Pressable key={o.value} onPress={() => setMode(o.value)} style={styles.option}>
          <Icon
            name={mode === o.value ? "radio-button-checked" : "radio-button-unchecked"}
            size={22}
            color={mode === o.value ? c.link : c.muted}
          />
          <Text style={{ color: c.text, fontSize: 15 }}>{o.label}</Text>
        </Pressable>
      ))}
      <View style={styles.footer}>
        <Pressable onPress={() => setOpen(false)}>
          <Text style={{ color: c.text, fontWeight: "600", padding: 4 }}>Done</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  menu: {
    position: "absolute",
    right: 8,
    minWidth: 200,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  item: { paddingHorizontal: 16, paddingVertical: 12 },
  section: { fontSize: 11, fontWeight: "600", letterSpacing: 1 },
  option: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 40 },
  footer: { flexDirection: "row", justifyContent: "flex-end" },
});
