import Composer from "@/components/Composer";
import NotesGrid from "@/components/NotesGrid";
import { IS_WEB } from "@/lib/platform";
import { useNoteList } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";

export default function NotesScreen() {
  const notes = useNoteList("notes");
  const searching = useSettings((s) => s.query.trim() !== "");
  return (
    <NotesGrid
      notes={notes}
      // the inline "Take a note..." bar is the web design; the phone app uses the + button
      header={IS_WEB && !searching ? <Composer /> : null}
      groupPinned
      emptyIcon={searching ? "search" : "lightbulb-outline"}
      emptyText={searching ? "No matching notes" : "Notes you add appear here"}
    />
  );
}
