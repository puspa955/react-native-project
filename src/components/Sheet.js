import { Modal, Pressable, StyleSheet, Text } from "react-native";
import { useTheme } from "@/hooks/useTheme";

// Centered dialog with a dimmed backdrop; tapping the backdrop closes it.
export default function Sheet({ visible, onClose, title, children }) {
  const c = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* inner Pressable swallows taps so they don't reach the backdrop */}
        <Pressable
          onPress={() => {}}
          style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
        >
          {!!title && <Text style={[styles.title, { color: c.text }]}>{title}</Text>}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  title: { fontSize: 16, fontWeight: "600" },
});
