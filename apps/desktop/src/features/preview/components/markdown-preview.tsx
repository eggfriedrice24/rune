import { basename } from "@rune/core";
import * as React from "react";

import { useEditorStore } from "@/features/editor/store/editor";
import { renderMarkdown } from "@/features/preview/lib/render-markdown";

type MarkdownPreviewProps = {
  statusLabel?: string;
};

export function MarkdownPreview({ statusLabel = "Preview" }: MarkdownPreviewProps) {
  const currentFilePath = useEditorStore((state) => state.currentFilePath);
  const content = useEditorStore((state) => state.content);
  const deferredContent = React.useDeferredValue(content);
  const [html, setHtml] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!currentFilePath) {
      setHtml("");
      setError(null);
      return undefined;
    }

    let cancelled = false;

    void renderMarkdown(deferredContent)
      .then((nextHtml) => {
        if (cancelled) {
          return;
        }

        React.startTransition(() => {
          setHtml(nextHtml);
          setError(null);
        });
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }

        const message = err instanceof Error ? err.message : String(err);
        React.startTransition(() => {
          setError(message);
        });
      });

    return () => {
      cancelled = true;
    };
  }, [currentFilePath, deferredContent]);

  if (!currentFilePath) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <div className="text-2xl font-medium">No note selected</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Pick a Markdown file from the vault sidebar to preview it.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{basename(currentFilePath)}</div>
          <div className="truncate text-xs text-muted-foreground">{currentFilePath}</div>
        </div>
        <div className="shrink-0 text-xs text-muted-foreground">{statusLabel}</div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
        {error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : (
          <div className="rune-preview" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    </div>
  );
}
