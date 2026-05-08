import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { tauriStoreStorage } from "@/lib/tauri-store-adapter";

type EditorSettingsState = {
  vimModeEnabled: boolean;
  toggleVimMode: () => void;
};

export const useEditorSettingsStore = create<EditorSettingsState>()(
  persist(
    (set) => ({
      vimModeEnabled: false,
      toggleVimMode: () => set((state) => ({ vimModeEnabled: !state.vimModeEnabled })),
    }),
    {
      name: "rune.editor-settings",
      storage: createJSONStorage(() => tauriStoreStorage),
    },
  ),
);
