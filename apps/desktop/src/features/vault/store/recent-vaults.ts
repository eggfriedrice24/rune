import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { tauriStoreStorage } from "@/lib/tauri-store-adapter";

const MAX_RECENT_VAULTS = 8;

type RecentVaultsState = {
  recents: string[];
  pushRecent: (path: string) => void;
  removeRecent: (path: string) => void;
  clearRecents: () => void;
};

export const useRecentVaultsStore = create<RecentVaultsState>()(
  persist(
    (set) => ({
      recents: [],
      pushRecent: (path) =>
        set((state) => ({
          recents: [path, ...state.recents.filter((recentPath) => recentPath !== path)].slice(
            0,
            MAX_RECENT_VAULTS,
          ),
        })),
      removeRecent: (path) =>
        set((state) => ({ recents: state.recents.filter((recentPath) => recentPath !== path) })),
      clearRecents: () => set({ recents: [] }),
    }),
    {
      name: "rune.recent-vaults",
      storage: createJSONStorage(() => tauriStoreStorage),
    },
  ),
);
