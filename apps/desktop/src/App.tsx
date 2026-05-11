import { FolderAddIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";

import { AppHeader } from "@/components/app-header";
import { EditorShell } from "@/components/editor-shell";
import { RuneLogo } from "@/components/rune-logo";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/features/command/components/command-palette";
import { useEditorSettingsStore } from "@/features/editor/store/editor-settings";
import { useEditorStore } from "@/features/editor/store/editor";
import { startLibraryWatcher } from "@/features/library/lib/library-fs";
import {
  LibraryDialogs,
  type CreateDialogType,
  type DeleteLibraryEntryTarget,
} from "@/features/library/components/library-dialogs";
import { useLibraryStore } from "@/features/library/store/library";
import { usePreviewStore } from "@/features/preview/store/preview";
import { useKeybindings } from "@/hooks/use-keybindings";

export function App() {
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [createDialog, setCreateDialog] = React.useState<CreateDialogType | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteLibraryEntryTarget | null>(null);
  const [keybindingsOpen, setKeybindingsOpen] = React.useState(false);
  const [libraryDialogOpen, setLibraryDialogOpen] = React.useState(false);

  const libraryPath = useLibraryStore((state) => state.libraryPath);
  const reloadLibrary = useLibraryStore((state) => state.reload);
  const refreshCurrentFileFromDisk = useEditorStore((state) => state.refreshCurrentFileFromDisk);
  const toggleVimMode = useEditorSettingsStore((state) => state.toggleVimMode);
  const toggleLivePreview = usePreviewStore((state) => state.toggleLivePreview);
  const togglePreviewPane = usePreviewStore((state) => state.togglePreviewPane);

  useKeybindings({
    "command.open": () => setCommandOpen((open) => !open),
    "editor.vim.toggle": toggleVimMode,
    "keybindings.toggle": () => setKeybindingsOpen((open) => !open),
    "library.open": () => setLibraryDialogOpen(true),
    "preview.toggle": togglePreviewPane,
    "reading.toggle": toggleLivePreview,
  });

  React.useEffect(() => {
    if (!libraryPath) {
      return undefined;
    }

    let cancelled = false;
    let stopWatching: (() => void) | null = null;

    void startLibraryWatcher(libraryPath, () => {
      if (cancelled) {
        return;
      }

      void reloadLibrary();
      void refreshCurrentFileFromDisk();
    })
      .then((unwatch) => {
        if (cancelled) {
          unwatch();
          return;
        }

        stopWatching = unwatch;
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.error("Failed to watch library", err);
        }
      });

    return () => {
      cancelled = true;
      stopWatching?.();
    };
  }, [libraryPath, refreshCurrentFileFromDisk, reloadLibrary]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background/70">
      <AppHeader
        keybindingsOpen={keybindingsOpen}
        onCommandOpen={() => setCommandOpen(true)}
        onCreateDialogChange={setCreateDialog}
        onKeybindingsOpenChange={setKeybindingsOpen}
        onOpenLibrary={() => setLibraryDialogOpen(true)}
        onTogglePreviewPane={togglePreviewPane}
        onToggleReadingMode={toggleLivePreview}
      />
      <main className="flex min-h-0 flex-1 overflow-hidden">
        {libraryPath ? (
          <EditorShell />
        ) : (
          <NoLibraryCallToAction onOpenLibraryDialog={() => setLibraryDialogOpen(true)} />
        )}
      </main>
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onCreateNote={() => setCreateDialog("note")}
        onCreateNotebook={() => setCreateDialog("notebook")}
        onDeleteEntry={setDeleteTarget}
        onOpenLibraryDialog={() => setLibraryDialogOpen(true)}
        onShowKeybindings={() => setKeybindingsOpen(true)}
        onTogglePreviewPane={togglePreviewPane}
        onToggleReadingMode={toggleLivePreview}
      />
      <LibraryDialogs
        createDialog={createDialog}
        deleteTarget={deleteTarget}
        libraryDialogOpen={libraryDialogOpen}
        onCreateDialogChange={setCreateDialog}
        onDeleteTargetChange={setDeleteTarget}
        onLibraryDialogOpenChange={setLibraryDialogOpen}
      />
    </div>
  );
}

function NoLibraryCallToAction({ onOpenLibraryDialog }: { onOpenLibraryDialog: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <RuneLogo size={72} />
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-medium">Start with a library</h1>
          <p className="text-sm text-muted-foreground">
            Create a local notes library or open an existing folder of Markdown notes.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={onOpenLibraryDialog}>
            <HugeiconsIcon icon={FolderAddIcon} data-icon="inline-start" />
            Create library
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Press <kbd className="rounded bg-muted px-1.5 py-0.5">Mod K</kbd> for commands.
        </p>
      </div>
    </div>
  );
}

export default App;
