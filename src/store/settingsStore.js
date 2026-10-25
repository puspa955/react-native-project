import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Saved: mode ("system" | "light" | "dark"), layout ("grid" | "list"), sidebarOpen.
// Not saved (UI state only): search query, dialogs/drawer, selected notes, toast.
export const useSettings = create(
  persist(
    (set, get) => ({
      mode: "system",
      setMode: (mode) => set({ mode }),

      // desktop sidebar: full width, or collapsed to a narrow icon strip (like Keep)
      sidebarOpen: true,
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),

      layout: "grid",
      toggleLayout: () => set({ layout: get().layout === "grid" ? "list" : "grid" }),

      query: "",
      setQuery: (query) => set({ query }),

      labelsModalOpen: false,
      setLabelsModalOpen: (labelsModalOpen) => set({ labelsModalOpen }),

      // the "Settings" dialog (theme choice)
      settingsOpen: false,
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),

      // mobile: the slide-in menu with Notes / Reminders / labels / Archive / Trash
      drawerOpen: false,
      setDrawerOpen: (drawerOpen) => set({ drawerOpen }),

      // "do this as soon as the editor opens" for a just-created note: { noteId, action }
      // where action is "image" or "draw" (used by the new-note shortcut buttons)
      pending: null,
      setPending: (pending) => set({ pending }),

      // the note being written in the inline "Take a note..." card (hidden from the grid meanwhile)
      composingId: null,
      setComposingId: (composingId) => set({ composingId }),

      // desktop: the note currently open in the dialog (null = none)
      openNoteId: null,
      setOpenNoteId: (openNoteId) => set({ openNoteId }),

      // ids of notes selected with a long press (or the check circle on web)
      selected: [],
      toggleSelect: (id) =>
        set({
          selected: get().selected.includes(id)
            ? get().selected.filter((x) => x !== id)
            : [...get().selected, id],
        }),
      clearSelection: () => set({ selected: [] }),

      // small bar at the bottom: { id, message, actionLabel?, onAction? }
      toast: null,
      showToast: (message, actionLabel, onAction) =>
        set({ toast: { id: Date.now(), message, actionLabel, onAction } }),
      hideToast: () => set({ toast: null }),
    }),
    {
      name: "keep-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        mode: state.mode,
        layout: state.layout,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
