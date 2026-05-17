import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { tauriStoreStorage } from "@/lib/tauri-store-adapter";

export type KeybindingId =
  | "command.open"
  | "keybindings.toggle"
  | "preview.toggle"
  | "reading.toggle"
  | "library.open"
  | "editor.vim.toggle"
  | "theme.toggle";

export type KeybindingDefinition = {
  id: KeybindingId;
  label: string;
  description?: string;
  defaultHotkey: string;
};

export const KEYBINDING_DEFINITIONS: Record<KeybindingId, KeybindingDefinition> = {
  "command.open": {
    id: "command.open",
    label: "Open command palette",
    defaultHotkey: "Mod+K",
  },
  "keybindings.toggle": {
    id: "keybindings.toggle",
    label: "Show keybindings",
    defaultHotkey: "Mod+/",
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
    label: "Open library manager",
    defaultHotkey: "Mod+O",
  },
  "editor.vim.toggle": {
    id: "editor.vim.toggle",
    label: "Toggle vim mode",
    defaultHotkey: "Mod+Shift+V",
  },
  "theme.toggle": {
    id: "theme.toggle",
    label: "Toggle theme",
    defaultHotkey: "Mod+Shift+T",
  },
};

const DEFAULT_BINDINGS: Record<KeybindingId, string> = {
  "command.open": "Mod+K",
  "keybindings.toggle": "Mod+/",
  "preview.toggle": "Mod+P",
  "reading.toggle": "Mod+R",
  "library.open": "Mod+O",
  "editor.vim.toggle": "Mod+Shift+V",
  "theme.toggle": "Mod+Shift+T",
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
    "command.open": bindings["command.open"] ?? DEFAULT_BINDINGS["command.open"],
    "editor.vim.toggle": bindings["editor.vim.toggle"] ?? DEFAULT_BINDINGS["editor.vim.toggle"],
    "keybindings.toggle": bindings["keybindings.toggle"] ?? DEFAULT_BINDINGS["keybindings.toggle"],
    "library.open": bindings["library.open"] ?? DEFAULT_BINDINGS["library.open"],
    "preview.toggle": bindings["preview.toggle"] ?? DEFAULT_BINDINGS["preview.toggle"],
    "reading.toggle": bindings["reading.toggle"] ?? DEFAULT_BINDINGS["reading.toggle"],
    "theme.toggle": bindings["theme.toggle"] ?? DEFAULT_BINDINGS["theme.toggle"],
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
      version: 6,
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
