import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import Composer from "@/components/Composer";
import NotesGrid from "@/components/NotesGrid";
import { useTheme } from "@/hooks/useTheme";
import { useNoteList, useNotes } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";

export default function LabelScreen() {
  const c = useTheme();
  const { id } = useLocalSearchParams();
  const label = useNotes((s) => s.labels.find((l) => l.id === id));
  const notes = useNoteList(`label:${id}`);
  const searching = useSettings((s) => s.query.trim() !== "");

  if (!label) {
    return (
      <Text style={{ color: c.muted, textAlign: "center", marginTop: 48, fontSize: 16 }}>
        This label doesn't exist.
      </Text>
    );
  }

  return (
    <NotesGrid
      notes={notes}
      groupPinned
      header={
        <>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: "600", marginBottom: 16 }}>
            🏷️ {label.name}
          </Text>
          {!searching && <Composer defaultLabels={[label.id]} />}
        </>
      }
      emptyText={searching ? "No matching notes" : "No notes with this label yet"}
    />
  );
}
