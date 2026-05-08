import { ArrowRight01Icon, FileIcon, FolderIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { nodeName, type LibraryNode, type LibraryStatus } from "@rune/core";
import * as React from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
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
  const currentFilePath = useEditorStore((state) => state.currentFilePath);
  const openFile = useEditorStore((state) => state.openFile);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <LibrarySwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <LibraryBody
              status={status}
              libraryPath={libraryPath}
              tree={tree}
              error={error}
              currentFilePath={currentFilePath}
              openFile={openFile}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

type LibraryBodyProps = {
  status: LibraryStatus;
  libraryPath: string | null;
  tree: LibraryNode[];
  error: string | null;
  currentFilePath: string | null;
  openFile: (path: string) => Promise<void>;
};

function LibraryBody({
  status,
  libraryPath,
  tree,
  error,
  currentFilePath,
  openFile,
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
        <Tree key={node.path} node={node} currentFilePath={currentFilePath} openFile={openFile} />
      ))}
    </SidebarMenu>
  );
}

type TreeProps = {
  node: LibraryNode;
  currentFilePath: string | null;
  openFile: (path: string) => Promise<void>;
};

function Tree({ node, currentFilePath, openFile }: TreeProps) {
  if (node.type === "file") {
    return (
      <SidebarMenuButton
        type="button"
        isActive={currentFilePath === node.path}
        className="data-[active=true]:bg-sidebar-accent"
        onClick={() => void openFile(node.path)}
      >
        <HugeiconsIcon icon={FileIcon} strokeWidth={2} className="text-chart-2" />
        {nodeName(node)}
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={false}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
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
                currentFilePath={currentFilePath}
                openFile={openFile}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
