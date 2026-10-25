import Composer from "@/components/Composer";
import NotesGrid from "@/components/NotesGrid";
import { useIsWide } from "@/hooks/useColumns";
import { useNoteList } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";

export default function NotesScreen() {
  const notes = useNoteList("notes");
  const wide = useIsWide();
  const searching = useSettings((s) => s.query.trim() !== "");
  return (
    <NotesGrid
      notes={notes}
      // the inline "Take a note..." bar is for wide screens; phones use the + button
      header={wide && !searching ? <Composer /> : null}
      groupPinned
      emptyIcon={searching ? "search" : "lightbulb-outline"}
      emptyText={searching ? "No matching notes" : "Notes you add appear here"}
    />
  );
}
