import Composer from "@/components/Composer";
import NotesGrid from "@/components/NotesGrid";
import { useNoteList } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";

export default function NotesScreen() {
  const notes = useNoteList("notes");
  const searching = useSettings((s) => s.query.trim() !== "");
  return (
    <NotesGrid
      notes={notes}
      header={searching ? null : <Composer />}
      groupPinned
      emptyText={searching ? "No matching notes" : "Notes you add appear here"}
    />
  );
}
