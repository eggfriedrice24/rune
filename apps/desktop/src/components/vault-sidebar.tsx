import { ArrowRight01Icon, FileIcon, FolderIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
import { useVaultStore, type VaultNode, type VaultStatus } from "@/lib/vault";

function basename(path: string): string {
  const cleaned = path.replace(/\/+$/, "");
  const idx = cleaned.lastIndexOf("/");
  return idx === -1 ? cleaned : cleaned.slice(idx + 1);
}

export function VaultSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const tree = useVaultStore((s) => s.tree);
  const status = useVaultStore((s) => s.status);
  const error = useVaultStore((s) => s.error);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="truncate px-2 py-1.5 text-sm font-medium">
          {vaultPath ? basename(vaultPath) : "Vault"}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <VaultBody status={status} vaultPath={vaultPath} tree={tree} error={error} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

type VaultBodyProps = {
  status: VaultStatus;
  vaultPath: string | null;
  tree: VaultNode[];
  error: string | null;
};

function VaultBody({ status, vaultPath, tree, error }: VaultBodyProps) {
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
      <div className="px-2 py-1 text-xs text-destructive">{error ?? "Failed to load vault."}</div>
    );
  }

  if (!vaultPath) {
    return (
      <div className="px-2 py-1 text-xs text-muted-foreground">
        No vault open. Press <kbd className="rounded bg-muted px-1.5 py-0.5">Space</kbd>{" "}
        <kbd className="rounded bg-muted px-1.5 py-0.5">o</kbd> to open one.
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="px-2 py-1 text-xs text-muted-foreground">Vault is empty (no .md files).</div>
    );
  }

  return (
    <SidebarMenu>
      {tree.map((node) => (
        <Tree key={node.path} node={node} />
      ))}
    </SidebarMenu>
  );
}

function Tree({ node }: { node: VaultNode }) {
  if (node.type === "file") {
    return (
      <SidebarMenuButton className="data-[active=true]:bg-transparent">
        <HugeiconsIcon icon={FileIcon} strokeWidth={2} className="text-chart-2" />
        {node.name}
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
            {node.name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {node.children.map((child) => (
              <Tree key={child.path} node={child} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
