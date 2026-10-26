import { Modal, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Brand from "@/components/Brand";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/store/settingsStore";

// Phone menu: slides in from the left when you tap the menu button. Tap outside to close.
export default function Drawer() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const open = useSettings((s) => s.drawerOpen);
  const setOpen = useSettings((s) => s.setDrawerOpen);
  const close = () => setOpen(false);

  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        {/* inner Pressable swallows taps so touching the menu itself doesn't close it */}
        <Pressable
          onPress={() => {}}
          style={[
            styles.panel,
            { backgroundColor: c.bg, borderRightColor: c.border, paddingTop: insets.top + 8 },
          ]}
        >
          <Brand style={styles.brand} />
          <Sidebar onNavigate={close} style={styles.sidebar} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  panel: { width: 290, maxWidth: "85%", height: "100%", borderRightWidth: 1 },
  brand: { padding: 16, paddingTop: 8 },
  sidebar: { width: "100%" },
});
