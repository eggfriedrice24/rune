import * as React from "react";

import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";

export function PreviewSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar side="right" {...props}>
      <SidebarHeader>
        <div className="px-2 py-1.5 text-sm font-medium">Preview</div>
      </SidebarHeader>
      <SidebarContent>
        <div className="p-4 text-sm text-muted-foreground">Rendered markdown will appear here.</div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
