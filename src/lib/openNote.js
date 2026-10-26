import { Dimensions } from "react-native";
import { IS_WEB } from "@/lib/platform";
import { newItem, useNotes } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";
import { WIDE_BREAKPOINT } from "@/theme";

// Like Google Keep: on a wide web window a note opens in a dialog. On a phone (the app, or a web
// window as narrow as a phone) it opens as a full page with a back button.
export function openNote(router, id) {
  const wideWeb = IS_WEB && Dimensions.get("window").width >= WIDE_BREAKPOINT;
  if (wideWeb) useSettings.getState().setOpenNoteId(id);
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
