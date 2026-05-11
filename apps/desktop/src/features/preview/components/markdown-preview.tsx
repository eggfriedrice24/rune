import * as React from "react";

import { useEditorStore } from "@/features/editor/store/editor";
import { renderMarkdown } from "@/features/preview/lib/render-markdown";

export function MarkdownPreview() {
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
      <div className="flex h-full flex-1 items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <div className="text-2xl font-medium">No note selected</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Open a note from the command palette to preview it.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
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
