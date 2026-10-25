import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOBILE_NAV } from "@/components/Sidebar";
import { useTheme } from "@/hooks/useTheme";

export default function BottomBar() {
  const c = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: insets.bottom, borderTopColor: c.border, backgroundColor: c.surface },
      ]}
    >
      {MOBILE_NAV.map((item) => {
        // a label's page (/label/xyz) counts as the Labels tab
        const active =
          pathname === item.href || (item.href === "/labels" && pathname.startsWith("/label/"));
        return (
          <Pressable
            key={item.href}
            onPress={() => router.navigate(item.href)}
            style={styles.item}
          >
            <Text style={[styles.icon, !active && { opacity: 0.5 }]}>{item.icon}</Text>
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                { color: active ? c.text : c.muted },
                active && styles.labelActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", borderTopWidth: 1 },
  item: { flex: 1, alignItems: "center", paddingVertical: 8, gap: 2 },
  icon: { fontSize: 20 },
  label: { fontSize: 10 },
  labelActive: { fontWeight: "600" },
});
