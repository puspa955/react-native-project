import { Pressable, StyleSheet, View } from "react-native";
import { NOTE_COLORS, colors } from "@/theme";

export default function ColorPicker({ value, onChange }) {
  return (
    <View style={styles.row}>
      {NOTE_COLORS.map((c) => (
        <Pressable
          key={c.key}
          onPress={() => onChange(c.key)}
          style={[
            styles.dot,
            { backgroundColor: c.value },
            value === c.key && styles.selected,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: { borderWidth: 2, borderColor: colors.text },
});
