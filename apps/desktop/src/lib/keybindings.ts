import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { tauriStoreStorage } from "@/lib/tauri-store-adapter";

export type KeybindingId = "vault.toggle" | "preview.toggle" | "reading.toggle" | "vault.open";

export type KeybindingDefinition = {
  id: KeybindingId;
  label: string;
  description?: string;
  defaultLeaderSuffix: string;
};

export const KEYBINDING_DEFINITIONS: Record<KeybindingId, KeybindingDefinition> = {
  "vault.toggle": {
    id: "vault.toggle",
    label: "Toggle vault sidebar",
    defaultLeaderSuffix: "b",
  },
  "preview.toggle": {
    id: "preview.toggle",
    label: "Toggle preview pane",
    defaultLeaderSuffix: "p",
  },
  "reading.toggle": {
    id: "reading.toggle",
    label: "Toggle reading mode",
    defaultLeaderSuffix: "r",
  },
  "vault.open": {
    id: "vault.open",
    label: "Open vault",
    defaultLeaderSuffix: "o",
  },
};

const DEFAULT_LEADER = "Space";

const DEFAULT_BINDINGS: Record<KeybindingId, string> = {
  "vault.toggle": "b",
  "preview.toggle": "p",
  "reading.toggle": "r",
  "vault.open": "o",
};

type KeybindingsState = {
  leader: string;
  bindings: Record<KeybindingId, string>;
  setLeader: (leader: string) => void;
  setBinding: (id: KeybindingId, suffix: string) => void;
  resetToDefaults: () => void;
};

export const useKeybindingsStore = create<KeybindingsState>()(
  persist(
    (set) => ({
      leader: DEFAULT_LEADER,
      bindings: DEFAULT_BINDINGS,
      setLeader: (leader) => set({ leader }),
      setBinding: (id, suffix) =>
        set((state) => ({ bindings: { ...state.bindings, [id]: suffix } })),
      resetToDefaults: () => set({ leader: DEFAULT_LEADER, bindings: DEFAULT_BINDINGS }),
    }),
    {
      name: "rune.keybindings",
      storage: createJSONStorage(() => tauriStoreStorage),
    },
  ),
);
