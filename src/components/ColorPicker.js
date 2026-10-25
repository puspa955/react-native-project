import { Pressable, StyleSheet, View } from "react-native";
import Tip from "@/components/Tip";
import { useTheme } from "@/hooks/useTheme";
import { NOTE_COLORS, noteBg } from "@/theme";

export default function ColorPicker({ value, onChange }) {
  const c = useTheme();
  return (
    <View style={styles.row}>
      {NOTE_COLORS.map((col) => (
        <Tip key={col.key} label={col.name} placement="top">
          <Pressable
            onPress={() => onChange(col.key)}
            accessibilityLabel={col.name}
            style={[
              styles.dot,
              { backgroundColor: noteBg(col.key, c.dark), borderColor: c.border },
              value === col.key && { borderWidth: 2, borderColor: c.text },
            ]}
          />
        </Tip>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1 },
});
