import { Modal, Pressable, StyleSheet } from "react-native";
import NoteEditor from "@/components/NoteEditor";
import { useSettings } from "@/store/settingsStore";

// Desktop: the open note shows in a dialog over the grid. Clicking outside closes it.
export default function NoteDialog() {
  const noteId = useSettings((s) => s.openNoteId);
  const setOpenNoteId = useSettings((s) => s.setOpenNoteId);
  const close = () => setOpenNoteId(null);

  if (!noteId) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        {/* inner Pressable swallows taps so clicks inside the note don't close it */}
        <Pressable onPress={() => {}} style={styles.card}>
          <NoteEditor noteId={noteId} onClose={close} variant="dialog" />
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
  card: { width: "100%", maxWidth: 600, maxHeight: "90%" },
});
