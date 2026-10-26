import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Icon from "@/components/Icon";
import { useTheme } from "@/hooks/useTheme";

// A small menu that opens right next to the button that was pressed (anchorRef), like the
// Settings menu: below the button when it is in the top half of the screen, above it otherwise,
// with its right edge lined up with the button's. Tapping outside closes it.
export default function Popover({ visible, anchorRef, onClose, children, minWidth = 200 }) {
  const c = useTheme();
  const { width, height } = useWindowDimensions();
  const [anchor, setAnchor] = useState(null); // where the button is on screen

  useEffect(() => {
    if (!visible) return;
    anchorRef.current?.measureInWindow((x, y, w, h) => setAnchor({ x, y, w, h }));
  }, [visible, anchorRef]);

  if (!visible) return null;

  const a = anchor || { x: width - 40, y: 20, w: 24, h: 24 };
  const right = Math.max(8, width - (a.x + a.w)); // right edge lines up with the button's
  const below = a.y + a.h / 2 < height / 2;
  const vertical = below ? { top: a.y + a.h + 8 } : { bottom: height - a.y + 8 };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* inner Pressable swallows taps so touching the menu doesn't close it */}
        <Pressable
          onPress={() => {}}
          style={[
            styles.panel,
            vertical,
            { right, minWidth, backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// One row of a popover menu. `selected` shows a check mark at the end (for "pick one" menus).
export function PopoverItem({ icon, label, onPress, selected = false, danger = false }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [styles.item, hovered && { backgroundColor: c.hover }]}
    >
      {!!icon && <Icon name={icon} size={20} color={danger ? c.danger : c.muted} />}
      <Text style={[styles.label, { color: danger ? c.danger : c.text }]}>{label}</Text>
      {selected && <Icon name="check" size={20} color={c.primary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  panel: {
    position: "absolute",
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  item: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  label: { flex: 1, fontSize: 14 },
});
