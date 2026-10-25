import { IS_WEB } from "@/lib/platform";
import { newItem, useNotes } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";

// Like Google Keep: on the web a note opens in a dialog, in the phone app it's a full screen.
export function openNote(router, id) {
  if (IS_WEB) useSettings.getState().setOpenNoteId(id);
  else router.push(`/note/${id}`);
}

// "New note" buttons: make an empty note (deleted again if you leave it empty) and open it.
// action: "image" or "draw" starts that straight away (like Keep's image / drawing buttons).
export function createNote(router, { type = "text", labels = [], action = null } = {}) {
  const id = useNotes.getState().add({
    type,
    labels,
    items: type === "list" ? [newItem()] : [],
  });
  if (action) useSettings.getState().setPending({ noteId: id, action });
  openNote(router, id);
}
