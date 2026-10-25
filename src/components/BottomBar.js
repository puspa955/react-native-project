import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NAV_ITEMS } from "@/components/Sidebar";
import { colors } from "@/theme";

export default function BottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Pressable
            key={item.href}
            onPress={() => router.navigate(item.href)}
            style={styles.item}
          >
            <Text style={[styles.icon, !active && { opacity: 0.5 }]}>{item.icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  item: { flex: 1, alignItems: "center", paddingVertical: 8, gap: 2 },
  icon: { fontSize: 20 },
  label: { fontSize: 11, color: colors.muted },
  labelActive: { color: colors.text, fontWeight: "600" },
});
