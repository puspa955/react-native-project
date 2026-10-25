import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "@/components/Icon";
import { useTheme } from "@/hooks/useTheme";
import { createNote } from "@/lib/openNote";

// Phone only: the round "+" button (new note) with a small "new list" button above it.
// Shown on Notes and on a label's page; a label's page starts new notes with that label.
export default function Fab() {
  const c = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const onNotes = pathname === "/";
  const onLabel = pathname.startsWith("/label/");
  if (!onNotes && !onLabel) return null;

  const labels = onLabel ? [pathname.slice("/label/".length)] : [];

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: 16 + insets.bottom }]}>
      <Pressable
        onPress={() => createNote(router, { type: "list", labels })}
        style={[styles.mini, { backgroundColor: c.input, borderColor: c.border }]}
        accessibilityLabel="New list"
      >
        <Icon name="check-box" size={22} color={c.text} />
      </Pressable>
      <Pressable
        onPress={() => createNote(router, { type: "text", labels })}
        style={[styles.fab, { backgroundColor: c.dark ? "#f9ab00" : "#fbbc04" }]}
        accessibilityLabel="New note"
      >
        <Icon name="add" size={30} color="#202124" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", right: 16, alignItems: "center", gap: 14, zIndex: 20 },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  mini: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
});
