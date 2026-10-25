import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SIDEBAR_WIDTH, colors } from "@/theme";

export const NAV_ITEMS = [
  { href: "/", label: "Notes", icon: "💡" },
  { href: "/archive", label: "Archive", icon: "🗃️" },
  { href: "/trash", label: "Trash", icon: "🗑️" },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.sidebar}>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Pressable
            key={item.href}
            onPress={() => router.navigate(item.href)}
            style={({ hovered }) => [
              styles.item,
              hovered && styles.hover,
              active && styles.active,
            ]}
          >
            <Text style={styles.icon}>{item.icon}</Text>
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
  sidebar: {
    width: SIDEBAR_WIDTH,
    paddingTop: 8,
    paddingRight: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    height: 48,
    paddingLeft: 24,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
  },
  hover: { backgroundColor: colors.hover },
  active: { backgroundColor: colors.active },
  icon: { fontSize: 18 },
  label: { fontSize: 14, color: colors.muted },
  labelActive: { color: colors.text, fontWeight: "600" },
});
