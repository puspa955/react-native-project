import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import Composer from "@/components/Composer";
import Icon from "@/components/Icon";
import NotesGrid from "@/components/NotesGrid";
import { IS_WEB } from "@/lib/platform";
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Icon name="label-outline" size={26} color={c.muted} />
            <Text style={{ color: c.text, fontSize: 20, fontWeight: "600" }}>{label.name}</Text>
          </View>
          {IS_WEB && !searching && <Composer defaultLabels={[label.id]} />}
        </>
      }
      emptyIcon={searching ? "search" : "label-outline"}
      emptyText={searching ? "No matching notes" : "No notes with this label yet"}
    />
  );
}
