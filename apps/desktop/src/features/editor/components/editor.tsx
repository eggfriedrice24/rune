import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { vim } from "@replit/codemirror-vim";
import { oneDark } from "@codemirror/theme-one-dark";
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

export function Editor() {
  const editorRef = React.useRef<ReactCodeMirrorRef>(null);
  const { theme } = useTheme();
  const currentFilePath = useEditorStore((state) => state.currentFilePath);
  const content = useEditorStore((state) => state.content);
  const cursorTarget = useEditorStore((state) => state.cursorTarget);
  const isDirty = useEditorStore((state) => state.isDirty);
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

  React.useEffect(() => {
    const view = editorRef.current?.view;
    if (!view || !cursorTarget) {
      return;
    }

    const line = view.state.doc.line(
      Math.min(Math.max(cursorTarget.line, 1), view.state.doc.lines),
    );
    const position = line.from + Math.min(Math.max(cursorTarget.column, 0), line.length);
    view.dispatch({
      effects: EditorView.scrollIntoView(position, { y: "center" }),
      selection: { anchor: position },
    });
    view.focus();
  }, [cursorTarget]);

  if (!currentFilePath) {
    return (
      <div className="flex h-full flex-1 items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <div className="text-2xl font-medium">No note selected</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Open a note from the command palette to start editing.
          </div>
        </div>
      </div>
    );
  }

  const editorTheme = theme === "system" ? resolvedTheme() : theme;

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
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
            highlightActiveLineGutter: false,
            lineNumbers: false,
          }}
          onChange={updateContent}
          className="rune-editor h-full text-sm"
        />
      </div>
      {error ? <div className="border-t px-4 py-2 text-xs text-destructive">{error}</div> : null}
    </div>
  );
}
