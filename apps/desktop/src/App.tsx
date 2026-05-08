import { FolderOpenIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import * as React from "react";

import { PreviewSidebar } from "@/components/preview-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { VaultSidebar } from "@/features/vault/components/vault-sidebar";
import { useKeybindings } from "@/hooks/use-keybindings";
import { useVaultStore } from "@/features/vault/store/vault";

export function App() {
  const [vaultOpen, setVaultOpen] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  const vaultPath = useVaultStore((s) => s.vaultPath);
  const openVault = useVaultStore((s) => s.openVault);

  useKeybindings({
    "vault.toggle": () => setVaultOpen((open) => !open),
    "preview.toggle": () => setPreviewOpen((open) => !open),
    "vault.open": () => void openVault(),
  });

  return (
    <SidebarProvider open={vaultOpen} onOpenChange={setVaultOpen}>
      <VaultSidebar />
      <SidebarProvider open={previewOpen} onOpenChange={setPreviewOpen}>
        <SidebarInset className="items-center justify-center gap-4">
          {vaultPath ? <EditorPlaceholder /> : <NoVaultCallToAction />}
        </SidebarInset>
        <PreviewSidebar />
      </SidebarProvider>
    </SidebarProvider>
  );
}

function EditorPlaceholder() {
  return (
    <>
      <div className="text-2xl font-medium">Editor</div>
      <div className="text-sm text-muted-foreground">CodeMirror 6 will live here.</div>
      <div className="text-xs text-muted-foreground">
        <kbd className="rounded bg-muted px-1.5 py-0.5">Space</kbd>{" "}
        <kbd className="rounded bg-muted px-1.5 py-0.5">b</kbd> vault,{" "}
        <kbd className="rounded bg-muted px-1.5 py-0.5">Space</kbd>{" "}
        <kbd className="rounded bg-muted px-1.5 py-0.5">p</kbd> preview,{" "}
        <kbd className="rounded bg-muted px-1.5 py-0.5">Space</kbd>{" "}
        <kbd className="rounded bg-muted px-1.5 py-0.5">o</kbd> open vault.
      </div>
    </>
  );
}

function NoVaultCallToAction() {
  const openVault = useVaultStore((s) => s.openVault);
  return (
    <>
      <div className="text-2xl font-medium">No vault open</div>
      <div className="max-w-sm text-center text-sm text-muted-foreground">
        Pick a folder to use as your vault. rune will read .md files from it. Notes stay on disk;
        nothing is uploaded.
      </div>
      <Button onClick={() => void openVault()}>
        <HugeiconsIcon icon={FolderOpenIcon} data-icon="inline-start" />
        Open vault
      </Button>
      <div className="text-xs text-muted-foreground">
        or press <kbd className="rounded bg-muted px-1.5 py-0.5">Space</kbd>{" "}
        <kbd className="rounded bg-muted px-1.5 py-0.5">o</kbd>
      </div>
    </>
  );
}

export default App;
