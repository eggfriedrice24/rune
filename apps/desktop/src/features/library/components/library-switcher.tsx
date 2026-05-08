import { ArrowRight01Icon, FolderOpenIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { basename } from "@rune/core";

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
import { useRecentLibrariesStore } from "@/features/library/store/recent-libraries";
import { useLibraryStore } from "@/features/library/store/library";

export function LibrarySwitcher() {
  const libraryPath = useLibraryStore((state) => state.libraryPath);
  const createLibrary = useLibraryStore((state) => state.createLibrary);
  const openLibrary = useLibraryStore((state) => state.openLibrary);
  const closeLibrary = useLibraryStore((state) => state.closeLibrary);
  const recents = useRecentLibrariesStore((state) => state.recents);

  function handleCreateLibrary() {
    const name = window.prompt("Library name");
    if (!name) {
      return;
    }

    void createLibrary(name);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton className="font-medium">
          <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={2} className="text-chart-2" />
          <span>{libraryPath ? basename(libraryPath) : "Library"}</span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="ml-auto rotate-90 text-muted-foreground"
          />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Recent libraries</DropdownMenuLabel>
        {recents.length === 0 ? (
          <DropdownMenuItem disabled>No recent libraries</DropdownMenuItem>
        ) : (
          recents.map((path) => (
            <DropdownMenuItem
              key={path}
              className="min-w-0 items-start"
              onSelect={() => void openLibrary(path)}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">{basename(path)}</span>
                <span className="truncate text-[0.625rem] text-muted-foreground">{path}</span>
              </span>
              {path === libraryPath ? <DropdownMenuShortcut>Current</DropdownMenuShortcut> : null}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleCreateLibrary}>Create library...</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void openLibrary()}>
          Open existing library...
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!libraryPath} onSelect={closeLibrary}>
          Close library
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
