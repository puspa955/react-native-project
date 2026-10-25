import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "@/components/Icon";
import { useTheme } from "@/hooks/useTheme";
import { createNote } from "@/lib/openNote";

// What the + button offers, closest to the button first (like Google Keep's phone app).
const ACTIONS = [
  { label: "Text", icon: "edit", options: { type: "text" } },
  { label: "List", icon: "check-box", options: { type: "list" } },
  { label: "Drawing", icon: "brush", options: { action: "draw" } },
  { label: "Image", icon: "image", options: { action: "image" } },
];

const native = Platform.OS !== "web";

// Phone app only: the round "+" button. Tapping it dims the screen and opens a menu of ways to
// start a note (Text, List, Drawing, Image). Shown on Notes and on a label's page; a label's page
// starts new notes with that label.
export default function Fab() {
  const c = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const progress = useRef(new Animated.Value(0)).current; // 0 = closed, 1 = open

  useEffect(() => {
    Animated.timing(progress, { toValue: open ? 1 : 0, duration: 180, useNativeDriver: native }).start();
  }, [open, progress]);

  // leaving the screen (e.g. through the menu) closes the speed-dial
  useEffect(() => setOpen(false), [pathname]);

  const onNotes = pathname === "/";
  const onLabel = pathname.startsWith("/label/");
  if (!onNotes && !onLabel) return null;

  const labels = onLabel ? [pathname.slice("/label/".length)] : [];
  const choose = (options) => () => {
    setOpen(false);
    createNote(router, { labels, ...options });
  };

  const bottom = 20 + insets.bottom;
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "135deg"] });
  const scrim = c.dark ? "rgba(32,33,36,0.92)" : "rgba(255,255,255,0.92)";

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      {open && <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: scrim }]} onPress={() => setOpen(false)} />}

      {/* the options, stacked above the + button */}
      {open &&
        ACTIONS.map((a, i) => (
          <Animated.View
            key={a.label}
            style={[
              styles.optionSlot,
              {
                bottom: bottom + 58 + 14 + i * 56,
                opacity: progress,
                transform: [
                  { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
                ],
              },
            ]}
          >
            {/* one rounded button: icon and label together */}
            <Pressable
              onPress={choose(a.options)}
              accessibilityLabel={a.label}
              style={[styles.option, { backgroundColor: c.surface, borderColor: c.border }]}
            >
              <Icon name={a.icon} size={22} color={c.text} />
              <Text style={[styles.optionText, { color: c.text }]}>{a.label}</Text>
            </Pressable>
          </Animated.View>
        ))}

      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={[styles.fab, { bottom, backgroundColor: c.dark ? "#f9ab00" : "#fbbc04" }]}
        accessibilityLabel={open ? "Close menu" : "New note"}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Icon name="add" size={30} color="#202124" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, zIndex: 20 },
  fab: {
    position: "absolute",
    right: 16,
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
  // positions an option over the + button (right edge lines up with the button's)
  optionSlot: { position: "absolute", right: 16 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 48,
    paddingLeft: 16,
    paddingRight: 20,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  optionText: { fontSize: 15, fontWeight: "500" },
});
