import {
  BookOpen02Icon,
  FileIcon,
  FilePlusIcon,
  FolderAddIcon,
  FolderIcon,
  FolderOpenIcon,
  SidebarLeftIcon,
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
import { useLibraryStore } from "@/features/library/store/library";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleLibrarySidebar: () => void;
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

function promptForName(label: string) {
  const name = window.prompt(label);
  return name?.trim() ? name : null;
}

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
  onOpenChange,
  onToggleLibrarySidebar,
  onTogglePreviewPane,
  onToggleReadingMode,
}: CommandPaletteProps) {
  const [search, setSearch] = React.useState("");
  const libraryPath = useLibraryStore((state) => state.libraryPath);
  const selectedNotebookPath = useLibraryStore((state) => state.selectedNotebookPath);
  const tree = useLibraryStore((state) => state.tree);
  const createLibrary = useLibraryStore((state) => state.createLibrary);
  const createNote = useLibraryStore((state) => state.createNote);
  const createNotebook = useLibraryStore((state) => state.createNotebook);
  const openLibrary = useLibraryStore((state) => state.openLibrary);
  const selectNotebook = useLibraryStore((state) => state.selectNotebook);
  const openFile = useEditorStore((state) => state.openFile);

  const entries = React.useMemo(
    () => (libraryPath ? flattenLibraryTree(tree, libraryPath) : []),
    [libraryPath, tree],
  );
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
      "create library",
      "new note",
      "new notebook",
      "open existing library",
      "toggle library sidebar",
      "toggle preview pane",
      "toggle reading mode",
      ...entries.map((entry) => entry.value),
    ],
    [entries],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Command Palette">
      <CommandInput
        placeholder="Type a command or path. Tab completes."
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
        <CommandEmpty>No command or note found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem
            value="create library"
            keywords={["new library", "add library"]}
            onSelect={() => {
              const name = promptForName("Library name");
              if (name) {
                run(() => createLibrary(name));
              }
            }}
          >
            <HugeiconsIcon icon={FolderAddIcon} strokeWidth={2} />
            Create library
          </CommandItem>
          <CommandItem
            value="new note"
            keywords={["add note", "create note", targetLabel]}
            disabled={!libraryPath}
            onSelect={() => {
              const name = promptForName(`Note name in ${targetLabel}`);
              if (name) {
                run(() => createNote(name));
              }
            }}
          >
            <HugeiconsIcon icon={FilePlusIcon} strokeWidth={2} />
            New note
            <CommandShortcut>{targetLabel}</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="new notebook"
            keywords={["add notebook", "create notebook", targetLabel]}
            disabled={!libraryPath}
            onSelect={() => {
              const name = promptForName(`Notebook name in ${targetLabel}`);
              if (name) {
                run(() => createNotebook(name));
              }
            }}
          >
            <HugeiconsIcon icon={FolderAddIcon} strokeWidth={2} />
            New notebook
            <CommandShortcut>{targetLabel}</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="open existing library"
            keywords={["import library", "open folder"]}
            onSelect={() => run(() => openLibrary())}
          >
            <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={2} />
            Open existing library
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="View">
          <CommandItem value="toggle library sidebar" onSelect={() => run(onToggleLibrarySidebar)}>
            <HugeiconsIcon icon={SidebarLeftIcon} strokeWidth={2} />
            Toggle library sidebar
            <CommandShortcut>Mod+B</CommandShortcut>
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
        {entries.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Library">
              {entries.map((entry) => (
                <CommandItem
                  key={entry.path}
                  value={entry.value}
                  keywords={[entry.label, entry.path, entry.type]}
                  onSelect={() =>
                    run(() => {
                      if (entry.type === "notebook") {
                        selectNotebook(entry.path);
                        return;
                      }

                      void openFile(entry.path);
                    })
                  }
                >
                  <span style={{ width: `${entry.depth * 14}px` }} />
                  <HugeiconsIcon
                    icon={entry.type === "notebook" ? FolderIcon : FileIcon}
                    strokeWidth={2}
                    className={entry.type === "notebook" ? "text-primary" : "text-chart-2"}
                  />
                  <span className="truncate">{entry.label}</span>
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
