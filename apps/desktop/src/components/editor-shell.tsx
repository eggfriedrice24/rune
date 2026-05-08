import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Editor } from "@/features/editor/components/editor";
import { MarkdownPreview } from "@/features/preview/components/markdown-preview";
import { usePreviewStore } from "@/features/preview/store/preview";

export function EditorShell() {
  const isPreviewPaneOpen = usePreviewStore((state) => state.isPreviewPaneOpen);
  const isLivePreview = usePreviewStore((state) => state.isLivePreview);

  if (!isPreviewPaneOpen) {
    return isLivePreview ? <MarkdownPreview statusLabel="Live" /> : <Editor />;
  }

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full">
      <ResizablePanel defaultSize="60%" minSize="35%">
        {isLivePreview ? <MarkdownPreview statusLabel="Live" /> : <Editor />}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="40%" minSize="20%">
        <MarkdownPreview statusLabel="Pane" />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
