import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IS_WEB } from "@/lib/platform";
import { useSettings } from "@/store/settingsStore";

const SHOW_MS = 5000;

// Dark bar with a message and an optional action (e.g. "Undo"). Hides itself after 5 seconds.
export default function Snackbar() {
  const toast = useSettings((s) => s.toast);
  const hideToast = useSettings((s) => s.hideToast);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(hideToast, SHOW_MS);
    return () => clearTimeout(timer); // a new toast (new id) restarts the timer
  }, [toast?.id, hideToast]);

  if (!toast) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: IS_WEB ? 24 : 96 + insets.bottom }]}
    >
      <View style={styles.bar}>
        <Text style={styles.message}>{toast.message}</Text>
        {!!toast.actionLabel && (
          <Pressable
            onPress={() => {
              toast.onAction?.();
              hideToast();
            }}
            hitSlop={8}
          >
            <Text style={styles.action}>{toast.actionLabel}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, alignItems: "center", zIndex: 50 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    minWidth: 240,
    maxWidth: 480,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: "#323232",
    elevation: 6,
  },
  message: { flex: 1, color: "#ffffff", fontSize: 14 },
  action: { color: "#fdd663", fontSize: 14, fontWeight: "600" },
});
