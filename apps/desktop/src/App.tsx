import * as React from "react";

import { PreviewSidebar } from "@/components/preview-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { VaultSidebar } from "@/components/vault-sidebar";
import { useKeybindings } from "@/hooks/use-keybindings";

export function App() {
  const [vaultOpen, setVaultOpen] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  useKeybindings({
    "vault.toggle": () => setVaultOpen((open) => !open),
    "preview.toggle": () => setPreviewOpen((open) => !open),
  });

  return (
    <SidebarProvider open={vaultOpen} onOpenChange={setVaultOpen}>
      <VaultSidebar />
      <SidebarProvider open={previewOpen} onOpenChange={setPreviewOpen}>
        <SidebarInset className="items-center justify-center gap-4">
          <div className="text-2xl font-medium">Editor</div>
          <div className="text-sm text-muted-foreground">CodeMirror 6 will live here.</div>
          <div className="text-xs text-muted-foreground">
            Press <kbd className="rounded bg-muted px-1.5 py-0.5">Space</kbd>{" "}
            <kbd className="rounded bg-muted px-1.5 py-0.5">b</kbd> to toggle vault,{" "}
            <kbd className="rounded bg-muted px-1.5 py-0.5">Space</kbd>{" "}
            <kbd className="rounded bg-muted px-1.5 py-0.5">p</kbd> for preview.
          </div>
        </SidebarInset>
        <PreviewSidebar />
      </SidebarProvider>
    </SidebarProvider>
  );
}

export default App;
