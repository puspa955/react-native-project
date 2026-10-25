import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Saved: mode ("system" | "light" | "dark").
// Not saved: query (search text) and labelsModalOpen (the "Edit labels" dialog).
export const useSettings = create(
  persist(
    (set) => ({
      mode: "system",
      setMode: (mode) => set({ mode }),
      query: "",
      setQuery: (query) => set({ query }),
      labelsModalOpen: false,
      setLabelsModalOpen: (labelsModalOpen) => set({ labelsModalOpen }),
    }),
    {
      name: "keep-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);
