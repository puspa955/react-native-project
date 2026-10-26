import { useNotes } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";

// Actions that also show a toast with "Undo". Used by the selection bar, cards and the editor.
function plural(ids, one, many) {
  return ids.length === 1 ? one : `${ids.length} ${many}`;
}

export function trashNotes(ids) {
  const before = useNotes.getState().trashMany(ids);
  useSettings.getState().showToast(
    plural(ids, "Note moved to Trash", "notes moved to Trash"),
    "Undo",
    () => useNotes.getState().restoreSnapshots(before)
  );
}

export function archiveNotes(ids) {
  const before = useNotes.getState().archiveMany(ids);
  const wasArchived = before.every((n) => n.archived);
  useSettings.getState().showToast(
    wasArchived
      ? plural(ids, "Note unarchived", "notes unarchived")
      : plural(ids, "Note archived", "notes archived"),
    "Undo",
    () => useNotes.getState().restoreSnapshots(before)
  );
}

export function copyNotes(ids) {
  ids.forEach((id) => useNotes.getState().duplicate(id));
  useSettings.getState().showToast(plural(ids, "Copy created", "copies created"));
}

export function pinNotes(ids) {
  useNotes.getState().pinMany(ids);
}
