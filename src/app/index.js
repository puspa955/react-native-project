import Composer from "@/components/Composer";
import NotesGrid from "@/components/NotesGrid";
import { useNoteList } from "@/store/notesStore";

export default function NotesScreen() {
  const notes = useNoteList("notes");
  return (
    <NotesGrid
      notes={notes}
      header={<Composer />}
      groupPinned
      emptyText="Notes you add appear here"
    />
  );
}
