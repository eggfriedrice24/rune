import {
  ArrowRight01Icon,
  FileIcon,
  FilePlusIcon,
  FolderAddIcon,
  FolderIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { basename, dirname, nodeName, type LibraryNode, type LibraryStatus } from "@rune/core";
import * as React from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useEditorStore } from "@/features/editor/store/editor";
import { LibrarySwitcher } from "@/features/library/components/library-switcher";
import { useLibraryStore } from "@/features/library/store/library";

export function LibrarySidebar(props: React.ComponentProps<typeof Sidebar>) {
  const libraryPath = useLibraryStore((s) => s.libraryPath);
  const tree = useLibraryStore((s) => s.tree);
  const status = useLibraryStore((s) => s.status);
  const error = useLibraryStore((s) => s.error);
  const selectedNotebookPath = useLibraryStore((s) => s.selectedNotebookPath);
  const createNote = useLibraryStore((s) => s.createNote);
  const createNotebook = useLibraryStore((s) => s.createNotebook);
  const selectNotebook = useLibraryStore((s) => s.selectNotebook);
  const currentFilePath = useEditorStore((state) => state.currentFilePath);
  const openFile = useEditorStore((state) => state.openFile);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <LibrarySwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Notes</SidebarGroupLabel>
          <LibraryCreateMenu
            disabled={!libraryPath || status === "loading"}
            targetLabel={
              selectedNotebookPath ? `In ${basename(selectedNotebookPath)}` : "In library"
            }
            createNote={createNote}
            createNotebook={createNotebook}
          />
          <SidebarGroupContent>
            <LibraryBody
              status={status}
              libraryPath={libraryPath}
              tree={tree}
              error={error}
              currentFilePath={currentFilePath}
              selectedNotebookPath={selectedNotebookPath}
              createNote={createNote}
              openFile={openFile}
              selectNotebook={selectNotebook}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

type LibraryCreateMenuProps = {
  disabled: boolean;
  targetLabel: string;
  createNote: (name: string, parentPath?: string | null) => Promise<void>;
  createNotebook: (name: string, parentPath?: string | null) => Promise<void>;
};

function promptForName(label: string) {
  const name = window.prompt(label);
  return name?.trim() ? name : null;
}

function LibraryCreateMenu({
  disabled,
  targetLabel,
  createNote,
  createNotebook,
}: LibraryCreateMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarGroupAction type="button" disabled={disabled} title="Create note or notebook">
          +<span className="sr-only">Create note or notebook</span>
        </SidebarGroupAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="max-w-sm w-full">
        <DropdownMenuLabel>{targetLabel}</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              const name = promptForName("Note name");
              if (name) {
                void createNote(name);
              }
            }}
          >
            <HugeiconsIcon icon={FilePlusIcon} strokeWidth={2} />
            New note
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              const name = promptForName("Notebook name");
              if (name) {
                void createNotebook(name);
              }
            }}
            className="shrink-0"
          >
            <HugeiconsIcon icon={FolderAddIcon} strokeWidth={2} />
            New notebook
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type LibraryBodyProps = {
  status: LibraryStatus;
  libraryPath: string | null;
  tree: LibraryNode[];
  error: string | null;
  currentFilePath: string | null;
  selectedNotebookPath: string | null;
  createNote: (name: string, parentPath?: string | null) => Promise<void>;
  openFile: (path: string) => Promise<void>;
  selectNotebook: (path: string | null) => void;
};

function LibraryBody({
  status,
  libraryPath,
  tree,
  error,
  currentFilePath,
  selectedNotebookPath,
  createNote,
  openFile,
  selectNotebook,
}: LibraryBodyProps) {
  if (status === "loading") {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (status === "error") {
    return (
      <div className="px-2 py-1 text-xs text-destructive">{error ?? "Failed to load library."}</div>
    );
  }

  if (!libraryPath) {
    return (
      <div className="px-2 py-1 text-xs text-muted-foreground">
        No library open. Press <kbd className="rounded bg-muted px-1.5 py-0.5">Mod</kbd>{" "}
        <kbd className="rounded bg-muted px-1.5 py-0.5">o</kbd> to open an existing one.
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="px-2 py-1 text-xs text-muted-foreground">
        Library is empty (no .md notes).
      </div>
    );
  }

  return (
    <SidebarMenu>
      {tree.map((node) => (
        <Tree
          key={node.path}
          node={node}
          libraryPath={libraryPath}
          currentFilePath={currentFilePath}
          selectedNotebookPath={selectedNotebookPath}
          createNote={createNote}
          openFile={openFile}
          selectNotebook={selectNotebook}
        />
      ))}
    </SidebarMenu>
  );
}

type TreeProps = {
  node: LibraryNode;
  libraryPath: string;
  currentFilePath: string | null;
  selectedNotebookPath: string | null;
  createNote: (name: string, parentPath?: string | null) => Promise<void>;
  openFile: (path: string) => Promise<void>;
  selectNotebook: (path: string | null) => void;
};

function Tree({
  node,
  libraryPath,
  currentFilePath,
  selectedNotebookPath,
  createNote,
  openFile,
  selectNotebook,
}: TreeProps) {
  if (node.type === "file") {
    return (
      <SidebarMenuButton
        type="button"
        isActive={currentFilePath === node.path}
        className="data-[active=true]:bg-sidebar-accent"
        onClick={() => {
          const parentPath = dirname(node.path);
          selectNotebook(parentPath && parentPath !== libraryPath ? parentPath : null);
          void openFile(node.path);
        }}
      >
        <HugeiconsIcon icon={FileIcon} strokeWidth={2} className="text-chart-2" />
        {nodeName(node)}
      </SidebarMenuButton>
    );
  }

  const isNotebookActive = selectedNotebookPath === node.path;
  const isCurrentFileInside = dirname(currentFilePath ?? "") === node.path;

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={isNotebookActive || isCurrentFileInside}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            isActive={isNotebookActive}
            className="data-[active=true]:bg-sidebar-accent"
            onClick={() => selectNotebook(node.path)}
          >
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={2}
              className="text-muted-foreground transition-transform"
            />
            <HugeiconsIcon
              icon={FolderIcon}
              strokeWidth={2}
              className="fill-primary text-primary"
            />
            {nodeName(node)}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {node.children.map((child) => (
              <Tree
                key={child.path}
                node={child}
                libraryPath={libraryPath}
                currentFilePath={currentFilePath}
                selectedNotebookPath={selectedNotebookPath}
                createNote={createNote}
                openFile={openFile}
                selectNotebook={selectNotebook}
              />
            ))}
            <SidebarMenuSubItem>
              <SidebarMenuSubButton asChild>
                <button
                  type="button"
                  onClick={() => {
                    const name = promptForName(`Note name in ${nodeName(node)}`);
                    if (name) {
                      void createNote(name, node.path);
                    }
                  }}
                >
                  <HugeiconsIcon icon={FilePlusIcon} strokeWidth={2} />
                  New note
                </button>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
