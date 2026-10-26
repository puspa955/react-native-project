import { StyleSheet, Text, View } from "react-native";
import Icon from "@/components/Icon";
import { useTheme } from "@/hooks/useTheme";

// The app icon with the name next to it. Used in the header and in the phone menu.
export default function Brand({ style }) {
  const c = useTheme();
  return (
    <View style={[styles.brand, style]}>
      <Icon name="article" size={30} color="#fbbc04" />
      <Text style={[styles.logo, { color: c.text }]}>Jotter</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { fontSize: 22, fontWeight: "700" },
});
