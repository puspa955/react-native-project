import { Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "@/components/Icon";
import Tip from "@/components/Tip";
import { useTheme } from "@/hooks/useTheme";
import { DEFAULT_FMT, TEXT_COLORS } from "@/lib/richText";

// Keep's "Aa" bar: Heading / Subheading, Bold, Italic, Underline, Strikethrough, text colour, and
// clear formatting. Everything applies to the line the cursor is on. `fmt` is that line's format;
// onChange(patch) merges a change into it.
export default function FormatBar({ fmt, onChange, placement = "top" }) {
  const c = useTheme();

  const toggle = (key) => () => onChange({ [key]: !fmt[key] });
  const heading = (h) => () => onChange({ h: fmt.h === h ? 0 : h });

  const iconButton = (label, name, active, onPress) => (
    <Tip label={label} placement={placement}>
      <Pressable
        onPress={onPress}
        accessibilityLabel={label}
        style={[styles.button, active && { backgroundColor: c.active }]}
      >
        <Icon name={name} size={20} color={active ? c.text : c.muted} />
      </Pressable>
    </Tip>
  );

  const textButton = (label, text, active, onPress) => (
    <Tip label={label} placement={placement}>
      <Pressable
        onPress={onPress}
        accessibilityLabel={label}
        style={[styles.button, active && { backgroundColor: c.active }]}
      >
        <Text style={[styles.text, { color: active ? c.text : c.muted }]}>{text}</Text>
      </Pressable>
    </Tip>
  );

  return (
    <View style={[styles.bar, { borderColor: c.border }]}>
      {textButton("Heading", "H1", fmt.h === 1, heading(1))}
      {textButton("Subheading", "H2", fmt.h === 2, heading(2))}
      <View style={[styles.divider, { backgroundColor: c.border }]} />
      {iconButton("Bold", "format-bold", fmt.b, toggle("b"))}
      {iconButton("Italic", "format-italic", fmt.i, toggle("i"))}
      {iconButton("Underline", "format-underlined", fmt.u, toggle("u"))}
      {iconButton("Strikethrough", "format-strikethrough", fmt.s, toggle("s"))}
      <View style={[styles.divider, { backgroundColor: c.border }]} />
      {TEXT_COLORS.map((col) => (
        <Tip key={col.name} label={`${col.name} text`} placement={placement}>
          <Pressable
            onPress={() => onChange({ color: col.value })}
            accessibilityLabel={`${col.name} text`}
            style={[
              styles.swatch,
              { backgroundColor: col.value || c.text, borderColor: c.border },
              fmt.color === col.value && { borderColor: c.primary, borderWidth: 2 },
            ]}
          />
        </Tip>
      ))}
      <View style={[styles.divider, { backgroundColor: c.border }]} />
      {iconButton("Clear formatting", "format-clear", false, () => onChange({ ...DEFAULT_FMT }))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  button: { minWidth: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 14, fontWeight: "700" },
  divider: { width: 1, height: 20, marginHorizontal: 4 },
  swatch: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, marginHorizontal: 3 },
});
