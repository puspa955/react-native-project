import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { newId } from "@/lib/id";
import { cancelReminder, scheduleReminder } from "@/lib/notifications";
import { useSettings } from "@/store/settingsStore";

const WEEK = 7 * 24 * 60 * 60 * 1000;

export function newItem(text = "") {
  return { id: newId(), text, done: false };
}

export function isEmptyNote(n) {
  if (n.title.trim() || n.body.trim()) return false;
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
          items: [],
          labels: [],
          color: "default",
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
            items: [],
          });
        } else {
          const lines = n.body.split("\n").filter((l) => l.trim());
          get().update(id, {
            type: "list",
            body: "",
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

      trash: (id) => {
        const n = get().notes.find((x) => x.id === id);
        if (n) cancelReminder(n.notificationId);
        get().update(id, {
          trashedAt: Date.now(),
          pinned: false,
          reminder: null,
          notificationId: null,
        });
      },
      restore: (id) => get().update(id, { trashedAt: null }),
      remove: (id) => {
        const n = get().notes.find((x) => x.id === id);
        if (n) cancelReminder(n.notificationId);
        set({ notes: get().notes.filter((x) => x.id !== id) });
      },

      emptyTrash: () => set({ notes: get().notes.filter((n) => !n.trashedAt) }),

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
  return useMemo(() => {
    const labelId = view.startsWith("label:") ? view.slice(6) : null;
    const list = notes.filter((n) => {
      if (view === "trash") return !!n.trashedAt && (!query || matches(n, query));
      if (n.trashedAt) return false;
      if (view === "reminders" && !n.reminder) return false;
      if (labelId && !(n.labels || []).includes(labelId)) return false;
      if (view === "notes" && n.archived) return false;
      if (view === "archive" && !n.archived) return false;
      return !query || matches(n, query);
    });
    if (view === "reminders") return list.sort((a, b) => a.reminder - b.reminder);
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, view, query]);
}
