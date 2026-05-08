import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { vim } from "@replit/codemirror-vim";
import { oneDark } from "@codemirror/theme-one-dark";
import { basename } from "@rune/core";
import CodeMirror, { EditorView, type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import * as React from "react";

import { useTheme } from "@/components/theme-provider";
import { useEditorSettingsStore } from "@/features/editor/store/editor-settings";
import { useEditorStore } from "@/features/editor/store/editor";

const BASE_EXTENSIONS = [markdown({ codeLanguages: languages }), EditorView.lineWrapping];
const VIM_EXTENSION = vim();

function resolvedTheme(): "light" | "dark" {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function statusText(status: "idle" | "loading" | "ready" | "saving" | "error", isDirty: boolean) {
  if (status === "loading") {
    return "Loading...";
  }

  if (status === "saving") {
    return "Saving...";
  }

  if (status === "error") {
    return "Save failed";
  }

  if (isDirty) {
    return "Unsaved";
  }

  return "Saved";
}

export function Editor() {
  const editorRef = React.useRef<ReactCodeMirrorRef>(null);
  const { theme } = useTheme();
  const currentFilePath = useEditorStore((state) => state.currentFilePath);
  const content = useEditorStore((state) => state.content);
  const isDirty = useEditorStore((state) => state.isDirty);
  const status = useEditorStore((state) => state.status);
  const error = useEditorStore((state) => state.error);
  const updateContent = useEditorStore((state) => state.updateContent);
  const saveCurrentFile = useEditorStore((state) => state.saveCurrentFile);
  const vimModeEnabled = useEditorSettingsStore((state) => state.vimModeEnabled);

  React.useEffect(() => {
    if (!currentFilePath || !isDirty) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      void saveCurrentFile();
    }, 500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [content, currentFilePath, isDirty, saveCurrentFile]);

  React.useEffect(() => {
    if (!currentFilePath) {
      return;
    }

    editorRef.current?.view?.focus();
  }, [currentFilePath]);

  if (!currentFilePath) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <div className="text-2xl font-medium">No note selected</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Pick a note from the library sidebar to start editing.
          </div>
        </div>
      </div>
    );
  }

  const editorTheme = theme === "system" ? resolvedTheme() : theme;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{basename(currentFilePath)}</div>
          <div className="truncate text-xs text-muted-foreground">{currentFilePath}</div>
        </div>
        <div className="shrink-0 text-xs text-muted-foreground">
          {vimModeEnabled ? "Vim · " : ""}
          {statusText(status, isDirty)}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <CodeMirror
          ref={editorRef}
          value={content}
          height="100%"
          autoFocus
          theme={editorTheme === "dark" ? oneDark : "light"}
          extensions={vimModeEnabled ? [VIM_EXTENSION, ...BASE_EXTENSIONS] : BASE_EXTENSIONS}
          basicSetup={{
            foldGutter: false,
          }}
          onChange={updateContent}
          className="rune-editor h-full text-sm"
        />
      </div>
      {error ? <div className="border-t px-4 py-2 text-xs text-destructive">{error}</div> : null}
    </div>
  );
}
