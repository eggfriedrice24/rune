import {
  BookOpen02Icon,
  FilePlusIcon,
  FolderAddIcon,
  FolderOpenIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { basename } from "@rune/core";

import { KeybindingsPopover } from "@/components/keybindings-popover";
import { RuneLogo } from "@/components/rune-logo";
import { Button } from "@/components/ui/button";
import { useEditorSettingsStore } from "@/features/editor/store/editor-settings";
import { useEditorStore } from "@/features/editor/store/editor";
import type { CreateDialogType } from "@/features/library/components/library-dialogs";
import { useLibraryStore } from "@/features/library/store/library";
import { usePreviewStore } from "@/features/preview/store/preview";

type AppHeaderProps = {
  keybindingsOpen: boolean;
  onCommandOpen: () => void;
  onCreateDialogChange: (dialog: CreateDialogType) => void;
  onKeybindingsOpenChange: (open: boolean) => void;
  onOpenLibrary: () => void;
  onTogglePreviewPane: () => void;
  onToggleReadingMode: () => void;
};

function editorStatusLabel(
  status: "idle" | "loading" | "ready" | "saving" | "error",
  isDirty: boolean,
) {
  if (status === "loading") {
    return "Loading";
  }

  if (status === "saving") {
    return "Saving";
  }

  if (status === "error") {
    return "Error";
  }

  if (isDirty) {
    return "Unsaved";
  }

  return "Saved";
}

export function AppHeader({
  keybindingsOpen,
  onCommandOpen,
  onCreateDialogChange,
  onKeybindingsOpenChange,
  onOpenLibrary,
  onTogglePreviewPane,
  onToggleReadingMode,
}: AppHeaderProps) {
  const libraryPath = useLibraryStore((state) => state.libraryPath);
  const currentFilePath = useEditorStore((state) => state.currentFilePath);
  const editorStatus = useEditorStore((state) => state.status);
  const isDirty = useEditorStore((state) => state.isDirty);
  const vimModeEnabled = useEditorSettingsStore((state) => state.vimModeEnabled);
  const isLivePreview = usePreviewStore((state) => state.isLivePreview);
  const isPreviewPaneOpen = usePreviewStore((state) => state.isPreviewPaneOpen);

  return (
    <header className="relative z-20 flex h-12 shrink-0 items-center justify-between gap-3 border-b bg-background/80 px-3 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-2">
        <RuneLogo size={32} />
        <div className="truncate text-sm font-medium">
          {currentFilePath
            ? basename(currentFilePath)
            : libraryPath
              ? basename(libraryPath)
              : "rune"}
        </div>
        <div className="truncate text-[0.6875rem] text-muted-foreground">
          {currentFilePath ?? libraryPath ?? "Local Markdown notes"}
        </div>
      </div>
      <div className="hidden min-w-0 flex-1 justify-center gap-2 md:flex">
        {libraryPath ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onCreateDialogChange("note")}
          >
            <HugeiconsIcon icon={FilePlusIcon} data-icon="inline-start" />
            New note
          </Button>
        ) : null}
        {libraryPath ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onCreateDialogChange("notebook")}
          >
            <HugeiconsIcon icon={FolderAddIcon} data-icon="inline-start" />
            New notebook
          </Button>
        ) : null}
        <Button type="button" variant="ghost" size="sm" onClick={onTogglePreviewPane}>
          <HugeiconsIcon icon={ViewIcon} data-icon="inline-start" />
          {isPreviewPaneOpen ? "Hide preview" : "Preview"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onToggleReadingMode}>
          <HugeiconsIcon icon={BookOpen02Icon} data-icon="inline-start" />
          {isLivePreview ? "Edit" : "Read"}
        </Button>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden text-[0.6875rem] text-muted-foreground sm:block">
          {vimModeEnabled ? "Vim / " : ""}
          {editorStatusLabel(editorStatus, isDirty)}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onOpenLibrary}>
          <HugeiconsIcon icon={FolderOpenIcon} data-icon="inline-start" />
          Library
        </Button>
        <KeybindingsPopover open={keybindingsOpen} onOpenChange={onKeybindingsOpenChange} />
        <Button type="button" size="sm" onClick={onCommandOpen}>
          Command
          <kbd className="ml-1 rounded bg-primary-foreground/20 px-1 text-[0.625rem]">Mod K</kbd>
        </Button>
      </div>
    </header>
  );
}
