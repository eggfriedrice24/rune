import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { tauriStoreStorage } from "@/lib/tauri-store-adapter";

const MAX_RECENT_LIBRARIES = 8;

type RecentLibrariesState = {
  recents: string[];
  pushRecent: (path: string) => void;
  removeRecent: (path: string) => void;
  clearRecents: () => void;
};

export const useRecentLibrariesStore = create<RecentLibrariesState>()(
  persist(
    (set) => ({
      recents: [],
      pushRecent: (path) =>
        set((state) => ({
          recents: [path, ...state.recents.filter((recentPath) => recentPath !== path)].slice(
            0,
            MAX_RECENT_LIBRARIES,
          ),
        })),
      removeRecent: (path) =>
        set((state) => ({ recents: state.recents.filter((recentPath) => recentPath !== path) })),
      clearRecents: () => set({ recents: [] }),
    }),
    {
      name: "rune.recent-libraries",
      storage: createJSONStorage(() => tauriStoreStorage),
    },
  ),
);
