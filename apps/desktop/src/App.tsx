import { FolderOpenIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { joinPath, libraryFolderName } from "@rune/core";
import * as React from "react";

import { EditorShell } from "@/components/editor-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommandPalette } from "@/features/command/components/command-palette";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useEditorSettingsStore } from "@/features/editor/store/editor-settings";
import { LibrarySidebar } from "@/features/library/components/library-sidebar";
import { getDefaultLibraryRoot } from "@/features/library/lib/library-paths";
import { useLibraryStore } from "@/features/library/store/library";
import { usePreviewStore } from "@/features/preview/store/preview";
import { useKeybindings } from "@/hooks/use-keybindings";
import { RuneLogo } from "./components/rune-logo";

export function App() {
  const [libraryOpen, setLibraryOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);

  const libraryPath = useLibraryStore((s) => s.libraryPath);
  const openLibrary = useLibraryStore((s) => s.openLibrary);
  const toggleVimMode = useEditorSettingsStore((state) => state.toggleVimMode);
  const toggleLivePreview = usePreviewStore((state) => state.toggleLivePreview);
  const togglePreviewPane = usePreviewStore((state) => state.togglePreviewPane);

  useKeybindings({
    "command.open": () => setCommandOpen((open) => !open),
    "editor.vim.toggle": toggleVimMode,
    "reading.toggle": toggleLivePreview,
    "library.toggle": () => setLibraryOpen((open) => !open),
    "preview.toggle": togglePreviewPane,
    "library.open": () => void openLibrary(),
  });

  return (
    <SidebarProvider open={libraryOpen} onOpenChange={setLibraryOpen}>
      <LibrarySidebar />
      <SidebarInset className={libraryPath ? "min-h-0" : "items-center justify-center gap-4"}>
        {libraryPath ? <EditorShell /> : <NoLibraryCallToAction />}
      </SidebarInset>
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onToggleLibrarySidebar={() => setLibraryOpen((open) => !open)}
        onTogglePreviewPane={togglePreviewPane}
        onToggleReadingMode={toggleLivePreview}
      />
    </SidebarProvider>
  );
}

function NoLibraryCallToAction() {
  const [libraryName, setLibraryName] = React.useState("");
  const [defaultRoot, setDefaultRoot] = React.useState<string | null>(null);
  const createLibrary = useLibraryStore((s) => s.createLibrary);
  const openLibrary = useLibraryStore((s) => s.openLibrary);
  const status = useLibraryStore((s) => s.status);
  const error = useLibraryStore((s) => s.error);
  const folderName = libraryFolderName(libraryName);

  React.useEffect(() => {
    let cancelled = false;

    void getDefaultLibraryRoot()
      .then((root) => {
        if (!cancelled) {
          setDefaultRoot(root);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDefaultRoot(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 px-6">
      <div className="flex gap-2 items-center self-start">
        <RuneLogo size={60} />

        <div>
          <h1 className="text-lg">Create Library</h1>

          <div className="text-xs text-muted-foreground">
            rune keeps notes as local Markdown files.
          </div>
        </div>
      </div>

      <form
        className="flex w-full max-w-xs flex-col items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void createLibrary(libraryName);
        }}
      >
        <Input
          id="library-name"
          autoFocus
          placeholder="Personal notes"
          value={libraryName}
          onChange={(event) => setLibraryName(event.target.value)}
        />

        <span className="min-h-4 text-xs text-muted-foreground">
          {defaultRoot && folderName
            ? joinPath(defaultRoot, folderName)
            : "Stored in your notes folder"}
        </span>

        <Button
          type="submit"
          disabled={!folderName || status === "loading"}
          className="mt-2 w-full"
        >
          Create Library
        </Button>
      </form>

      {status === "error" && error ? <div className="text-xs text-destructive">{error}</div> : null}

      <Button type="button" variant="ghost" onClick={() => void openLibrary()}>
        <HugeiconsIcon icon={FolderOpenIcon} data-icon="inline-start" />
        Open existing library
      </Button>

      <div className="text-xs text-muted-foreground">
        Press <kbd className="rounded bg-muted px-1.5 py-0.5">Mod</kbd>{" "}
        <kbd className="rounded bg-muted px-1.5 py-0.5">o</kbd> to open an existing library.
      </div>
    </div>
  );
}

export default App;
