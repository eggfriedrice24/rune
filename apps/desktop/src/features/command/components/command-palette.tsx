import {
  BookOpen02Icon,
  FileIcon,
  FilePlusIcon,
  FolderAddIcon,
  FolderIcon,
  FolderOpenIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { basename, type LibraryNode } from "@rune/core";
import * as React from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useEditorStore } from "@/features/editor/store/editor";
import type { DeleteLibraryEntryTarget } from "@/features/library/components/library-dialogs";
import { useLibraryStore } from "@/features/library/store/library";
import { useRecentLibrariesStore } from "@/features/library/store/recent-libraries";
import { searchLibraryNotes, type NoteSearchResult } from "@/features/search/lib/search-notes";

type CommandPaletteProps = {
  open: boolean;
  onCreateNote: () => void;
  onCreateNotebook: () => void;
  onDeleteEntry: (target: DeleteLibraryEntryTarget) => void;
  onOpenLibraryDialog: () => void;
  onOpenChange: (open: boolean) => void;
  onShowKeybindings: () => void;
  onTogglePreviewPane: () => void;
  onToggleReadingMode: () => void;
};

type LibraryCommandEntry = {
  depth: number;
  label: string;
  path: string;
  type: "note" | "notebook";
  value: string;
};

function relativePath(libraryPath: string, path: string) {
  return path
    .slice(libraryPath.length)
    .replace(/^[\\/]+/, "")
    .replace(/\\/g, "/");
}

function flattenLibraryTree(
  nodes: LibraryNode[],
  libraryPath: string,
  depth = 0,
): LibraryCommandEntry[] {
  return nodes.flatMap((node): LibraryCommandEntry[] => {
    const path = relativePath(libraryPath, node.path);
    const entry: LibraryCommandEntry = {
      depth,
      label: node.name,
      path: node.path,
      type: node.type === "directory" ? "notebook" : "note",
      value: path,
    };

    if (node.type === "file") {
      return [entry];
    }

    return [entry, ...flattenLibraryTree(node.children, libraryPath, depth + 1)];
  });
}

function firstAutocompleteMatch(search: string, values: string[]) {
  const query = search.trim().toLowerCase();
  if (!query) {
    return null;
  }

  return (
    values.find((value) => value.toLowerCase().startsWith(query)) ??
    values.find((value) => value.toLowerCase().includes(query)) ??
    null
  );
}

export function CommandPalette({
  open,
  onCreateNote,
  onCreateNotebook,
  onDeleteEntry,
  onOpenLibraryDialog,
  onOpenChange,
  onShowKeybindings,
  onTogglePreviewPane,
  onToggleReadingMode,
}: CommandPaletteProps) {
  const [search, setSearch] = React.useState("");
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [searchResults, setSearchResults] = React.useState<NoteSearchResult[]>([]);
  const deferredSearch = React.useDeferredValue(search);
  const libraryPath = useLibraryStore((state) => state.libraryPath);
  const selectedNotebookPath = useLibraryStore((state) => state.selectedNotebookPath);
  const tree = useLibraryStore((state) => state.tree);
  const openLibrary = useLibraryStore((state) => state.openLibrary);
  const selectNotebook = useLibraryStore((state) => state.selectNotebook);
  const recents = useRecentLibrariesStore((state) => state.recents);
  const openFile = useEditorStore((state) => state.openFile);
  const openFileAtLocation = useEditorStore((state) => state.openFileAtLocation);

  const entries = React.useMemo(
    () => (libraryPath ? flattenLibraryTree(tree, libraryPath) : []),
    [libraryPath, tree],
  );
  const notes = entries.filter((entry) => entry.type === "note");
  const notebooks = entries.filter((entry) => entry.type === "notebook");
  const targetLabel = selectedNotebookPath ? basename(selectedNotebookPath) : "library root";

  const close = React.useCallback(() => {
    setSearch("");
    onOpenChange(false);
  }, [onOpenChange]);

  const run = React.useCallback(
    (callback: () => void | Promise<void>) => {
      close();
      void callback();
    },
    [close],
  );

  const autocompleteValues = React.useMemo(
    () => [
      "library actions",
      "new note",
      "new notebook",
      "open existing library",
      "show keybindings",
      "toggle preview pane",
      "toggle reading mode",
      ...recents.map((path) => `switch library ${basename(path)}`),
      ...searchResults.map((result) => result.relativePath),
      ...entries.map((entry) => entry.value),
      ...entries.map((entry) => `delete ${entry.type} ${entry.value}`),
    ],
    [entries, recents, searchResults],
  );

  React.useEffect(() => {
    if (!open || !libraryPath || !deferredSearch.trim()) {
      setSearchError(null);
      setSearchResults([]);
      return undefined;
    }

    let cancelled = false;
    setSearchError(null);
    const timeout = window.setTimeout(() => {
      void searchLibraryNotes({ libraryPath, query: deferredSearch })
        .then((results) => {
          if (!cancelled) {
            setSearchResults(results);
          }
        })
        .catch((error: unknown) => {
          if (cancelled) {
            return;
          }

          console.error("Command palette search failed", error);
          setSearchResults([]);
          setSearchError(error instanceof Error ? error.message : String(error));
        });
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [deferredSearch, libraryPath, open]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Command Palette">
      <CommandInput
        placeholder="Type a command, library, notebook, note, or search. Tab completes."
        value={search}
        onValueChange={setSearch}
        onKeyDown={(event) => {
          if (event.key !== "Tab") {
            return;
          }

          const match = firstAutocompleteMatch(search, autocompleteValues);
          if (!match || match === search) {
            return;
          }

          event.preventDefault();
          setSearch(match);
        }}
      />
      <CommandList>
        <CommandEmpty>No command, library, or note found.</CommandEmpty>
        <CommandGroup heading="Create">
          <CommandItem
            value="new note"
            keywords={["add note", "create note", targetLabel]}
            disabled={!libraryPath}
            onSelect={() => run(onCreateNote)}
          >
            <HugeiconsIcon icon={FilePlusIcon} strokeWidth={2} />
            New note
            <CommandShortcut>{targetLabel}</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="new notebook"
            keywords={["add notebook", "create notebook", targetLabel]}
            disabled={!libraryPath}
            onSelect={() => run(onCreateNotebook)}
          >
            <HugeiconsIcon icon={FolderAddIcon} strokeWidth={2} />
            New notebook
            <CommandShortcut>{targetLabel}</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Library Actions">
          <CommandItem
            value="library actions"
            keywords={[
              "change library",
              "create library",
              "manage library",
              "new library",
              "open existing library",
              "open folder",
              "switch library",
            ]}
            onSelect={() => run(onOpenLibraryDialog)}
          >
            <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={2} />
            Library actions
            <CommandShortcut>Mod+O</CommandShortcut>
          </CommandItem>
          {recents.map((path) => (
            <CommandItem
              key={path}
              value={`switch library ${basename(path)} ${path}`}
              keywords={[basename(path), path, "recent library"]}
              onSelect={() => run(() => openLibrary(path))}
            >
              <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={2} className="text-chart-2" />
              <div className="min-w-0 flex-1">
                <div className="truncate">{basename(path)}</div>
                <div className="truncate text-[0.6875rem] text-muted-foreground">{path}</div>
              </div>
              {path === libraryPath ? <CommandShortcut>current</CommandShortcut> : null}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="View">
          <CommandItem
            value="show keybindings"
            keywords={["keyboard", "shortcuts", "hotkeys"]}
            onSelect={() => run(onShowKeybindings)}
          >
            <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} />
            Show keybindings
            <CommandShortcut>Mod+/</CommandShortcut>
          </CommandItem>
          <CommandItem value="toggle preview pane" onSelect={() => run(onTogglePreviewPane)}>
            <HugeiconsIcon icon={ViewIcon} strokeWidth={2} />
            Toggle preview pane
            <CommandShortcut>Mod+P</CommandShortcut>
          </CommandItem>
          <CommandItem value="toggle reading mode" onSelect={() => run(onToggleReadingMode)}>
            <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} />
            Toggle reading mode
            <CommandShortcut>Mod+R</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        {searchError ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Search error">
              <CommandItem value={`search error ${searchError}`} disabled>
                <HugeiconsIcon icon={FileIcon} strokeWidth={2} className="text-destructive" />
                <div className="min-w-0 flex-1 truncate text-destructive">{searchError}</div>
              </CommandItem>
            </CommandGroup>
          </>
        ) : null}
        {searchResults.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Search">
              {searchResults.map((result) => (
                <CommandItem
                  key={result.path}
                  value={`search ${result.relativePath} ${result.title} ${result.snippet} ${deferredSearch}`}
                  keywords={[
                    result.name,
                    result.relativePath,
                    result.title,
                    result.snippet,
                    deferredSearch,
                  ]}
                  onSelect={() =>
                    run(() =>
                      openFileAtLocation(result.path, { column: result.column, line: result.line }),
                    )
                  }
                >
                  <HugeiconsIcon icon={FileIcon} strokeWidth={2} className="text-chart-2" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{result.title}</div>
                    <div className="truncate text-[0.6875rem] text-muted-foreground">
                      {result.relativePath} - {result.snippet}
                    </div>
                  </div>
                  <CommandShortcut>match</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
        {notebooks.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Notebooks">
              {notebooks.map((entry) => (
                <CommandItem
                  key={entry.path}
                  value={`notebook ${entry.value}`}
                  keywords={[entry.label, entry.path, "select notebook"]}
                  onSelect={() => run(() => selectNotebook(entry.path))}
                >
                  <span style={{ width: `${entry.depth * 14}px` }} />
                  <HugeiconsIcon icon={FolderIcon} strokeWidth={2} className="text-primary" />
                  <span className="truncate">{entry.label}</span>
                  <CommandShortcut>select</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
        {notes.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Notes">
              {notes.map((entry) => (
                <CommandItem
                  key={entry.path}
                  value={`note ${entry.value}`}
                  keywords={[entry.label, entry.path, "open note"]}
                  onSelect={() => run(() => openFile(entry.path))}
                >
                  <span style={{ width: `${entry.depth * 14}px` }} />
                  <HugeiconsIcon icon={FileIcon} strokeWidth={2} className="text-chart-2" />
                  <span className="truncate">{entry.label}</span>
                  <CommandShortcut>open</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
        {entries.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Delete">
              {entries.map((entry) => (
                <CommandItem
                  key={entry.path}
                  value={`delete ${entry.type} ${entry.value}`}
                  keywords={[entry.label, entry.path, entry.type, "remove"]}
                  onSelect={() =>
                    run(() =>
                      onDeleteEntry({ label: entry.label, path: entry.path, type: entry.type }),
                    )
                  }
                >
                  <span style={{ width: `${entry.depth * 14}px` }} />
                  <HugeiconsIcon
                    icon={entry.type === "notebook" ? FolderIcon : FileIcon}
                    strokeWidth={2}
                    className="text-destructive"
                  />
                  <span className="truncate">Delete {entry.label}</span>
                  <CommandShortcut>{entry.type}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
