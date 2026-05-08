import { useHotkeys } from "@tanstack/react-hotkeys";

import { KEYBINDING_DEFINITIONS, type KeybindingId, useKeybindingsStore } from "@/lib/keybindings";

type KeybindingHandlers = Partial<Record<KeybindingId, () => void>>;

export function useKeybindings(handlers: KeybindingHandlers) {
  const bindings = useKeybindingsStore((state) => state.bindings);

  const definitions = Object.values(KEYBINDING_DEFINITIONS).flatMap(({ id }) => {
    const handler = handlers[id];
    if (!handler) {
      return [];
    }
    return [
      {
        hotkey: bindings[id],
        callback: handler,
      },
    ];
  });

  useHotkeys(definitions);
}
