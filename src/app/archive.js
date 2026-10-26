import NotesGrid from "@/components/NotesGrid";
import { useNoteList, useSearching } from "@/store/notesStore";

export default function ArchiveScreen() {
  const notes = useNoteList("archive");
  const searching = useSearching();
  return (
    <NotesGrid
      notes={notes}
      emptyIcon={searching ? "search" : "archive"}
      emptyText={searching ? "No matching notes" : "Your archived notes appear here"}
    />
  );
}
