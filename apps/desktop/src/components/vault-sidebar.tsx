import * as React from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ArrowRight01Icon, FileIcon, FolderIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type TreeNode = string | [string, ...TreeNode[]];

function nodeName(node: TreeNode): string {
  return Array.isArray(node) ? node[0] : node;
}

const PLACEHOLDER_VAULT: TreeNode[] = [
  ["inbox", "scratch.md", "todo.md"],
  ["projects", ["rune", "spec.md", "roadmap.md"], "ideas.md"],
  ["daily", "2026-05-07.md", "2026-05-06.md"],
  "README.md",
];

export function VaultSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="px-2 py-1.5 text-sm font-medium">Vault</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Files</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PLACEHOLDER_VAULT.map((item) => (
                <Tree key={nodeName(item)} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

function Tree({ item }: { item: TreeNode }) {
  const [name, ...items] = Array.isArray(item) ? item : [item];

  if (!items.length) {
    return (
      <SidebarMenuButton className="data-[active=true]:bg-transparent">
        <HugeiconsIcon icon={FileIcon} strokeWidth={2} />
        {name}
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
              className="transition-transform"
            />
            <HugeiconsIcon icon={FolderIcon} strokeWidth={2} />
            {name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((subItem) => (
              <Tree key={nodeName(subItem)} item={subItem} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
