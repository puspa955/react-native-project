import NotesGrid from "@/components/NotesGrid";
import { useNoteList } from "@/store/notesStore";

export default function ArchiveScreen() {
  const notes = useNoteList("archive");
  return <NotesGrid notes={notes} emptyText="Your archived notes appear here" />;
}
