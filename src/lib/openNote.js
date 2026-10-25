import { Dimensions } from "react-native";
import { newItem, useNotes } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";
import { WIDE_BREAKPOINT } from "@/theme";

const isWide = () => Dimensions.get("window").width >= WIDE_BREAKPOINT;

// Like Google Keep: on a wide screen a note opens in a dialog, on a phone it's a full screen.
export function openNote(router, id) {
  if (isWide()) useSettings.getState().setOpenNoteId(id);
  else router.push(`/note/${id}`);
}

// Phone "+" buttons: make an empty note (deleted again if you leave it empty) and open it.
export function createNote(router, { type = "text", labels = [] } = {}) {
  const id = useNotes.getState().add({
    type,
    labels,
    items: type === "list" ? [newItem()] : [],
  });
  router.push(`/note/${id}`);
}
