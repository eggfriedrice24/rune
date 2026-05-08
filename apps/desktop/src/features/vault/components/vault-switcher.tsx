import { ArrowRight01Icon, FolderOpenIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useRecentVaultsStore } from "@/features/vault/store/recent-vaults";
import { useVaultStore } from "@/features/vault/store/vault";

function basename(path: string): string {
  const cleaned = path.replace(/\/+$/, "");
  const idx = cleaned.lastIndexOf("/");
  return idx === -1 ? cleaned : cleaned.slice(idx + 1);
}

export function VaultSwitcher() {
  const vaultPath = useVaultStore((state) => state.vaultPath);
  const openVault = useVaultStore((state) => state.openVault);
  const closeVault = useVaultStore((state) => state.closeVault);
  const recents = useRecentVaultsStore((state) => state.recents);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton className="font-medium">
          <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={2} className="text-chart-2" />
          <span>{vaultPath ? basename(vaultPath) : "Vault"}</span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="ml-auto rotate-90 text-muted-foreground"
          />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Recent vaults</DropdownMenuLabel>
        {recents.length === 0 ? (
          <DropdownMenuItem disabled>No recent vaults</DropdownMenuItem>
        ) : (
          recents.map((path) => (
            <DropdownMenuItem
              key={path}
              className="min-w-0 items-start"
              onSelect={() => void openVault(path)}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">{basename(path)}</span>
                <span className="truncate text-[0.625rem] text-muted-foreground">{path}</span>
              </span>
              {path === vaultPath ? <DropdownMenuShortcut>Current</DropdownMenuShortcut> : null}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void openVault()}>Open vault...</DropdownMenuItem>
        <DropdownMenuItem disabled={!vaultPath} onSelect={closeVault}>
          Close vault
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
