import { detectPlatform, matchesKeyboardEvent, parseHotkey } from "@tanstack/react-hotkeys";
import * as React from "react";

import { KEYBINDING_DEFINITIONS, type KeybindingId, useKeybindingsStore } from "@/lib/keybindings";

type KeybindingHandlers = Partial<Record<KeybindingId, () => void>>;

export function useKeybindings(handlers: KeybindingHandlers) {
  const bindings = useKeybindingsStore((state) => state.bindings);

  const definitions = React.useMemo(
    () =>
      Object.values(KEYBINDING_DEFINITIONS).flatMap(({ id }) => {
        const handler = handlers[id];
        if (!handler) {
          return [];
        }

        return [
          {
            callback: handler,
            hotkey: bindings[id],
            parsedHotkey: parseHotkey(bindings[id], detectPlatform()),
          },
        ];
      }),
    [bindings, handlers],
  );

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      for (const definition of definitions) {
        if (!matchesKeyboardEvent(event, definition.parsedHotkey)) {
          continue;
        }

        event.preventDefault();
        event.stopPropagation();
        definition.callback();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [definitions]);
}
