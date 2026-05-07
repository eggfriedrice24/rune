import { useHotkeySequences } from "@tanstack/react-hotkeys";

import type { KeybindingId } from "@/lib/keybindings";
import { useKeybindingsStore } from "@/lib/keybindings";

type KeybindingHandlers = Partial<Record<KeybindingId, () => void>>;

export function useKeybindings(handlers: KeybindingHandlers) {
  const leader = useKeybindingsStore((state) => state.leader);
  const bindings = useKeybindingsStore((state) => state.bindings);

  const definitions = (Object.keys(bindings) as KeybindingId[]).flatMap((id) => {
    const handler = handlers[id];
    if (!handler) {
      return [];
    }
    return [
      {
        sequence: [leader, bindings[id]],
        callback: handler,
      },
    ];
  });

  useHotkeySequences(definitions);
}
