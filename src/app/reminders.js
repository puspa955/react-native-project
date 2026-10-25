import NotesGrid from "@/components/NotesGrid";
import { useNoteList } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";

export default function RemindersScreen() {
  const notes = useNoteList("reminders");
  const searching = useSettings((s) => s.query.trim() !== "");
  return (
    <NotesGrid
      notes={notes}
      emptyIcon={searching ? "search" : "notifications-none"}
      emptyText={searching ? "No matching notes" : "Notes with upcoming reminders appear here"}
    />
  );
}
