import NotesGrid from "@/components/NotesGrid";
import { useNoteList, useSearching } from "@/store/notesStore";

export default function RemindersScreen() {
  const notes = useNoteList("reminders");
  const searching = useSearching();
  return (
    <NotesGrid
      notes={notes}
      emptyIcon={searching ? "search" : "notifications-none"}
      emptyText={searching ? "No matching notes" : "Notes with upcoming reminders appear here"}
    />
  );
}
