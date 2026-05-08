import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { tauriStoreStorage } from "@/lib/tauri-store-adapter";

export type KeybindingId =
  | "library.toggle"
  | "preview.toggle"
  | "reading.toggle"
  | "library.open"
  | "editor.vim.toggle";

export type KeybindingDefinition = {
  id: KeybindingId;
  label: string;
  description?: string;
  defaultHotkey: string;
};

export const KEYBINDING_DEFINITIONS: Record<KeybindingId, KeybindingDefinition> = {
  "library.toggle": {
    id: "library.toggle",
    label: "Toggle library sidebar",
    defaultHotkey: "Mod+B",
  },
  "preview.toggle": {
    id: "preview.toggle",
    label: "Toggle preview pane",
    defaultHotkey: "Mod+P",
  },
  "reading.toggle": {
    id: "reading.toggle",
    label: "Toggle reading mode",
    defaultHotkey: "Mod+R",
  },
  "library.open": {
    id: "library.open",
    label: "Open existing library",
    defaultHotkey: "Mod+O",
  },
  "editor.vim.toggle": {
    id: "editor.vim.toggle",
    label: "Toggle vim mode",
    defaultHotkey: "Mod+Shift+V",
  },
};

const DEFAULT_BINDINGS: Record<KeybindingId, string> = {
  "library.toggle": "Mod+B",
  "preview.toggle": "Mod+P",
  "reading.toggle": "Mod+R",
  "library.open": "Mod+O",
  "editor.vim.toggle": "Mod+Shift+V",
};

type KeybindingsState = {
  bindings: Record<KeybindingId, string>;
  setBinding: (id: KeybindingId, hotkey: string) => void;
  resetToDefaults: () => void;
};

function normalizeBindings(bindings: Partial<Record<KeybindingId, string>> | undefined) {
  if (!bindings) {
    return DEFAULT_BINDINGS;
  }

  const hasChordBindings = Object.values(bindings).some((binding) => binding?.includes("+"));
  if (!hasChordBindings) {
    return DEFAULT_BINDINGS;
  }

  return {
    ...DEFAULT_BINDINGS,
    ...bindings,
  };
}

export const useKeybindingsStore = create<KeybindingsState>()(
  persist(
    (set) => ({
      bindings: DEFAULT_BINDINGS,
      setBinding: (id, hotkey) =>
        set((state) => ({ bindings: { ...state.bindings, [id]: hotkey } })),
      resetToDefaults: () => set({ bindings: DEFAULT_BINDINGS }),
    }),
    {
      name: "rune.keybindings",
      storage: createJSONStorage(() => tauriStoreStorage),
      version: 3,
      migrate: (persistedState) => {
        if (
          !persistedState ||
          typeof persistedState !== "object" ||
          !("bindings" in persistedState) ||
          typeof persistedState.bindings !== "object" ||
          persistedState.bindings === null
        ) {
          return { bindings: DEFAULT_BINDINGS };
        }

        return {
          bindings: normalizeBindings(
            persistedState.bindings as Partial<Record<KeybindingId, string>>,
          ),
        };
      },
    },
  ),
);
