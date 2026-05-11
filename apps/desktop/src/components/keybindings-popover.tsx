import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { KEYBINDING_DEFINITIONS, useKeybindingsStore } from "@/lib/keybindings";

type KeybindingsPopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function KeybindingsPopover({ open, onOpenChange }: KeybindingsPopoverProps) {
  const bindings = useKeybindingsStore((state) => state.bindings);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Keys
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Keybindings</PopoverTitle>
          <PopoverDescription>Keyboard-first controls for the current install.</PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col gap-1">
          {Object.values(KEYBINDING_DEFINITIONS).map((definition) => (
            <div
              key={definition.id}
              className="flex items-center justify-between gap-3 rounded-md px-1 py-1"
            >
              <span className="truncate text-muted-foreground">{definition.label}</span>
              <kbd className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[0.625rem] text-foreground">
                {bindings[definition.id]}
              </kbd>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
