import NotesGrid from "@/components/NotesGrid";
import { useNoteList } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";

export default function ArchiveScreen() {
  const notes = useNoteList("archive");
  const searching = useSettings((s) => s.query.trim() !== "");
  return (
    <NotesGrid
      notes={notes}
      emptyText={searching ? "No matching notes" : "Your archived notes appear here"}
    />
  );
}
