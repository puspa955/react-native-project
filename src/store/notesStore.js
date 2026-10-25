import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const WEEK = 7 * 24 * 60 * 60 * 1000;

export const useNotes = create(
  persist(
    (set, get) => ({
      notes: [],

      add: (partial) => {
        const now = Date.now();
        const note = {
          id: Crypto.randomUUID(),
          title: "",
          body: "",
          color: "default",
          pinned: false,
          archived: false,
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

      trash: (id) => get().update(id, { trashedAt: Date.now(), pinned: false }),
      restore: (id) => get().update(id, { trashedAt: null }),
      remove: (id) => set({ notes: get().notes.filter((n) => n.id !== id) }),

      emptyTrash: () => set({ notes: get().notes.filter((n) => !n.trashedAt) }),

      // Notes stay in the trash for 7 days, like Google Keep.
      purgeOldTrash: () =>
        set({
          notes: get().notes.filter(
            (n) => !n.trashedAt || Date.now() - n.trashedAt < WEEK
          ),
        }),
    }),
    {
      name: "keep-notes",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ notes: state.notes }),
    }
  )
);

// view: "notes" | "archive" | "trash"
// Filter in useMemo, not inside the zustand selector (a selector that builds a new
// array every time makes React re-render in a loop).
export function useNoteList(view) {
  const notes = useNotes((s) => s.notes);
  return useMemo(() => {
    const list = notes.filter((n) => {
      if (view === "trash") return !!n.trashedAt;
      if (n.trashedAt) return false;
      return view === "archive" ? n.archived : !n.archived;
    });
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, view]);
}
