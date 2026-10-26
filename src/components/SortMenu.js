import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Icon from "@/components/Icon";
import Popover, { PopoverItem } from "@/components/Popover";
import Tip from "@/components/Tip";
import { useTheme } from "@/hooks/useTheme";
import { SORT_OPTIONS } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";

// Header button: opens a small menu to choose how notes are ordered.
export default function SortMenu() {
  const c = useTheme();
  const sortBy = useSettings((s) => s.sortBy);
  const setSortBy = useSettings((s) => s.setSortBy);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);

  return (
    <>
      <Tip label="Sort notes">
        <Pressable ref={buttonRef} onPress={() => setOpen(true)} hitSlop={8} accessibilityLabel="Sort notes">
          <Icon name="sort" size={24} color={c.muted} />
        </Pressable>
      </Tip>
      <Popover visible={open} anchorRef={buttonRef} onClose={() => setOpen(false)} minWidth={230}>
        <Text style={[styles.heading, { color: c.muted }]}>SORT BY</Text>
        {SORT_OPTIONS.map((o) => (
          <PopoverItem
            key={o.value}
            label={o.label}
            selected={sortBy === o.value}
            onPress={() => {
              setSortBy(o.value);
              setOpen(false);
            }}
          />
        ))}
      </Popover>
    </>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 11, fontWeight: "600", letterSpacing: 1, paddingHorizontal: 16, paddingVertical: 8 },
});
