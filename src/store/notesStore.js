import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { newId } from "@/lib/id";
import { cancelReminder, scheduleReminder } from "@/lib/notifications";
import { useSettings } from "@/store/settingsStore";

const WEEK = 7 * 24 * 60 * 60 * 1000;

// The ways to order notes (the header's sort menu). Pinned notes still come first in the Notes view.
export const SORT_OPTIONS = [
  { value: "edited", label: "Last edited" },
  { value: "created", label: "Date created (newest first)" },
  { value: "created-asc", label: "Date created (oldest first)" },
  { value: "title", label: "Title (A to Z)" },
];

// The note types you can filter by in the search panel.
export const FILTER_TYPES = [
  { value: "reminders", label: "Reminders", icon: "notifications-none", test: (n) => !!n.reminder },
  { value: "lists", label: "Lists", icon: "check-box", test: (n) => n.type === "list" },
  { value: "images", label: "Images", icon: "image", test: (n) => (n.images || []).length > 0 },
  { value: "drawings", label: "Drawings", icon: "brush", test: (n) => (n.drawings || []).length > 0 },
];

export function hasActiveFilters(f) {
  return f.types.length > 0 || f.colors.length > 0 || f.labels.length > 0;
}

// true while a search is going on: some text is typed or a filter is picked
export function useSearching() {
  const query = useSettings((s) => s.query);
  const filters = useSettings((s) => s.filters);
  return query.trim() !== "" || hasActiveFilters(filters);
}

function matchesFilters(n, f) {
  if (f.types.length && !FILTER_TYPES.some((t) => f.types.includes(t.value) && t.test(n))) return false;
  if (f.colors.length && !f.colors.includes(n.color)) return false;
  if (f.labels.length && !f.labels.some((id) => (n.labels || []).includes(id))) return false;
  return true;
}

const SORTERS = {
  edited: (a, b) => b.updatedAt - a.updatedAt,
  created: (a, b) => b.createdAt - a.createdAt,
  "created-asc": (a, b) => a.createdAt - b.createdAt,
  // notes without a title go last
  title: (a, b) => {
    if (!a.title.trim() !== !b.title.trim()) return a.title.trim() ? -1 : 1;
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  },
};

export function newItem(text = "") {
  return { id: newId(), text, done: false };
}

export function isEmptyNote(n) {
  if (n.title.trim() || n.body.trim()) return false;
  if ((n.images || []).length || (n.drawings || []).length) return false;
  return (n.items || []).every((i) => !i.text.trim());
}

function matches(n, q) {
  const s = q.toLowerCase();
  return (
    n.title.toLowerCase().includes(s) ||
    n.body.toLowerCase().includes(s) ||
    (n.items || []).some((i) => i.text.toLowerCase().includes(s))
  );
}

export const useNotes = create(
  persist(
    (set, get) => ({
      notes: [],
      // [{ id, name }]; notes point at labels by id so renaming a label is one change
      labels: [],

      // partial can set type: "text" | "list", items: [{ id, text, done }], labels: [labelId]
      add: (partial) => {
        const now = Date.now();
        const note = {
          id: newId(),
          type: "text",
          title: "",
          body: "",
          lineFormats: [], // the look of each line of body (heading, bold, ...), see lib/richText.js
          items: [],
          labels: [],
          images: [], // [{ id, uri, width, height }]
          drawings: [], // [{ id, width, height, strokes: [{ id, tool, color, size, points }] }]
          color: "default",
          background: null, // key of a background picture (see backgrounds.js), or null
          pinned: false,
          archived: false,
          reminder: null, // timestamp (ms) or null
          notificationId: null, // id of the scheduled phone notification
          trashedAt: null,
          createdAt: now,
          updatedAt: now,
          ...partial,
        };
        set({ notes: [note, ...get().notes] });
        return note.id;
      },

      update: (id, patch) =>
        set({
          notes: get().notes.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n
          ),
        }),

      togglePin: (id) => {
        const n = get().notes.find((x) => x.id === id);
        if (n) get().update(id, { pinned: !n.pinned, archived: false });
      },

      toggleArchive: (id) => {
        const n = get().notes.find((x) => x.id === id);
        if (n) get().update(id, { archived: !n.archived, pinned: false });
      },

      // text note <-> checklist note
      toggleType: (id) => {
        const n = get().notes.find((x) => x.id === id);
        if (!n) return;
        if (n.type === "list") {
          get().update(id, {
            type: "text",
            body: n.items.map((i) => i.text).join("\n"),
            lineFormats: [],
            items: [],
          });
        } else {
          const lines = n.body.split("\n").filter((l) => l.trim());
          get().update(id, {
            type: "list",
            body: "",
            lineFormats: [],
            items: (lines.length ? lines : [""]).map(newItem),
          });
        }
      },

      // timestamp = set/replace the reminder, null = remove it
      setReminder: async (id, timestamp) => {
        const n = get().notes.find((x) => x.id === id);
        if (!n) return;
        await cancelReminder(n.notificationId);
        get().update(id, { reminder: timestamp, notificationId: null });
        if (timestamp) {
          const notificationId = await scheduleReminder(n, timestamp);
          get().update(id, { notificationId });
        }
      },

      // ---- actions on several notes (also used for one) ----
      // Each returns the notes as they were, so the caller can offer "Undo" via restoreSnapshots.
      trashMany: (ids) => {
        const before = get().notes.filter((n) => ids.includes(n.id));
        before.forEach((n) => cancelReminder(n.notificationId));
        const now = Date.now();
        set({
          notes: get().notes.map((n) =>
            ids.includes(n.id)
              ? {
                  ...n,
                  trashedAt: now,
                  pinned: false,
                  reminder: null,
                  notificationId: null,
                  updatedAt: now,
                }
              : n
          ),
        });
        return before;
      },
      trash: (id) => get().trashMany([id]),

      // all already archived -> unarchive them, otherwise archive them all
      archiveMany: (ids) => {
        const before = get().notes.filter((n) => ids.includes(n.id));
        const archive = !before.every((n) => n.archived);
        const now = Date.now();
        set({
          notes: get().notes.map((n) =>
            ids.includes(n.id)
              ? { ...n, archived: archive, pinned: false, updatedAt: now }
              : n
          ),
        });
        return before;
      },

      // all already pinned -> unpin them, otherwise pin them all
      pinMany: (ids) => {
        const before = get().notes.filter((n) => ids.includes(n.id));
        const pin = !before.every((n) => n.pinned);
        const now = Date.now();
        set({
          notes: get().notes.map((n) =>
            ids.includes(n.id)
              ? { ...n, pinned: pin, archived: pin ? false : n.archived, updatedAt: now }
              : n
          ),
        });
        return before;
      },

      // Put notes back exactly as they were (undo), and re-schedule their reminders.
      restoreSnapshots: (snapshots) => {
        set({
          notes: get().notes.map((n) => snapshots.find((s) => s.id === n.id) || n),
        });
        snapshots.forEach((s) => s.reminder && get().setReminder(s.id, s.reminder));
      },

      // Make a copy of a note (without its reminder); returns the new note's id.
      duplicate: (id) => {
        const n = get().notes.find((x) => x.id === id);
        if (!n) return null;
        return get().add({
          type: n.type,
          title: n.title,
          body: n.body,
          lineFormats: n.lineFormats || [],
          items: (n.items || []).map((i) => ({ ...i, id: newId() })),
          labels: n.labels || [],
          images: (n.images || []).map((i) => ({ ...i, id: newId() })),
          drawings: (n.drawings || []).map((d) => ({ ...d, id: newId() })),
          color: n.color,
          background: n.background || null,
        });
      },

      // A note has a colour OR a background picture: choosing one clears the other.
      setColor: (id, color) => get().update(id, { color, background: null }),
      setBackground: (id, background) =>
        get().update(id, { background, color: "default" }),

      // ---- images and drawings ----
      addImages: (id, images) => {
        const n = get().notes.find((x) => x.id === id);
        if (n) get().update(id, { images: [...(n.images || []), ...images] });
      },
      removeImage: (id, imageId) => {
        const n = get().notes.find((x) => x.id === id);
        if (n) get().update(id, { images: (n.images || []).filter((i) => i.id !== imageId) });
      },
      // add a new drawing, or replace it when a drawing with the same id exists
      saveDrawing: (id, drawing) => {
        const n = get().notes.find((x) => x.id === id);
        if (!n) return;
        const list = n.drawings || [];
        const exists = list.some((d) => d.id === drawing.id);
        get().update(id, {
          drawings: exists ? list.map((d) => (d.id === drawing.id ? drawing : d)) : [...list, drawing],
        });
      },
      removeDrawing: (id, drawingId) => {
        const n = get().notes.find((x) => x.id === id);
        if (n) get().update(id, { drawings: (n.drawings || []).filter((d) => d.id !== drawingId) });
      },

      restore: (id) => get().update(id, { trashedAt: null }),
      remove: (id) => {
        const n = get().notes.find((x) => x.id === id);
        if (n) cancelReminder(n.notificationId);
        set({ notes: get().notes.filter((x) => x.id !== id) });
      },

      emptyTrash: () => set({ notes: get().notes.filter((n) => !n.trashedAt) }),

      // Drafts that were never filled in (e.g. the app was closed while a new note was open).
      purgeEmpty: () => set({ notes: get().notes.filter((n) => n.trashedAt || !isEmptyNote(n)) }),

      // Notes stay in the trash for 7 days, like Google Keep.
      purgeOldTrash: () =>
        set({
          notes: get().notes.filter(
            (n) => !n.trashedAt || Date.now() - n.trashedAt < WEEK
          ),
        }),

      // ---- labels ----
      // Returns the label id (reuses an existing label with the same name), or null if blank.
      addLabel: (name) => {
        const clean = name.trim();
        if (!clean) return null;
        const existing = get().labels.find(
          (l) => l.name.toLowerCase() === clean.toLowerCase()
        );
        if (existing) return existing.id;
        const label = { id: newId(), name: clean };
        set({ labels: [...get().labels, label] });
        return label.id;
      },

      renameLabel: (id, name) => {
        const clean = name.trim();
        const taken = get().labels.some(
          (l) => l.id !== id && l.name.toLowerCase() === clean.toLowerCase()
        );
        if (!clean || taken) return;
        set({ labels: get().labels.map((l) => (l.id === id ? { ...l, name: clean } : l)) });
      },

      deleteLabel: (id) =>
        set({
          labels: get().labels.filter((l) => l.id !== id),
          notes: get().notes.map((n) =>
            (n.labels || []).includes(id)
              ? { ...n, labels: n.labels.filter((x) => x !== id) }
              : n
          ),
        }),

      toggleNoteLabel: (noteId, labelId) => {
        const n = get().notes.find((x) => x.id === noteId);
        if (!n) return;
        const current = n.labels || [];
        get().update(noteId, {
          labels: current.includes(labelId)
            ? current.filter((x) => x !== labelId)
            : [...current, labelId],
        });
      },
    }),
    {
      name: "keep-notes",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ notes: state.notes, labels: state.labels }),
    }
  )
);

// view: "notes" | "archive" | "trash" | "reminders" | "label:<labelId>"
// Also applies the header search text.
// Filter in useMemo, not inside the zustand selector (a selector that builds a new
// array every time makes React re-render in a loop).
export function useNoteList(view) {
  const notes = useNotes((s) => s.notes);
  const query = useSettings((s) => s.query).trim();
  const composingId = useSettings((s) => s.composingId);
  const sortBy = useSettings((s) => s.sortBy);
  const filters = useSettings((s) => s.filters);
  return useMemo(() => {
    const labelId = view.startsWith("label:") ? view.slice(6) : null;
    const list = notes.filter((n) => {
      if (n.id === composingId) return false;
      if (!matchesFilters(n, filters)) return false;
      if (view === "trash") return !!n.trashedAt && (!query || matches(n, query));
      if (n.trashedAt) return false;
      if (view === "reminders" && !n.reminder) return false;
      if (labelId && !(n.labels || []).includes(labelId)) return false;
      if (view === "notes" && n.archived) return false;
      if (view === "archive" && !n.archived) return false;
      return !query || matches(n, query);
    });
    if (view === "reminders") return list.sort((a, b) => a.reminder - b.reminder);
    return list.sort(SORTERS[sortBy] || SORTERS.edited);
  }, [notes, view, query, composingId, sortBy, filters]);
}
