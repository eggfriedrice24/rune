import * as React from "react";

import { PreviewSidebar } from "@/components/preview-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { VaultSidebar } from "@/components/vault-sidebar";

export function App() {
  const [vaultOpen, setVaultOpen] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  return (
    <SidebarProvider open={vaultOpen} onOpenChange={setVaultOpen}>
      <VaultSidebar />
      <SidebarProvider open={previewOpen} onOpenChange={setPreviewOpen}>
        <SidebarInset className="items-center justify-center gap-4">
          <div className="text-2xl font-medium">Editor</div>
          <div className="text-sm text-muted-foreground">CodeMirror 6 will live here.</div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setVaultOpen((v) => !v)}>
              Toggle Vault
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen((v) => !v)}>
              Toggle Preview
            </Button>
          </div>
        </SidebarInset>
        <PreviewSidebar />
      </SidebarProvider>
    </SidebarProvider>
  );
}

export default App;
