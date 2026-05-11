import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { mkdir, remove, writeTextFile } from "@tauri-apps/plugin-fs";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  dirname,
  joinPath,
  libraryFolderName,
  noteFileName,
  type DirectoryNode,
  type LibraryNode,
  type LibraryStatus,
} from "@rune/core";
import { useEditorStore } from "@/features/editor/store/editor";
import { getDefaultLibraryPath, getDefaultLibraryRoot } from "@/features/library/lib/library-paths";
import { readLibraryTree } from "@/features/library/lib/library-fs";
import { useRecentLibrariesStore } from "@/features/library/store/recent-libraries";
import { tauriStoreStorage } from "@/lib/tauri-store-adapter";

const WELCOME_NOTE = `# Welcome to rune

This is your first note.

- Write Markdown files anywhere in this library.
- Use notebooks to keep related notes together.
- rune will show notes in the command palette automatically.
`;

function noteContent(name: string) {
  return `# ${name.trim().replace(/\.md$/i, "")}
`;
}

function uniqueChildName(name: string, tree: LibraryNode[]) {
  const existingNames = new Set(tree.map((node) => node.name));
  if (!existingNames.has(name)) {
    return name;
  }

  const extensionIndex = name.lastIndexOf(".");
  const stem = extensionIndex === -1 ? name : name.slice(0, extensionIndex);
  const extension = extensionIndex === -1 ? "" : name.slice(extensionIndex);
  return (
    Array.from({ length: 999 }, (_, index) => `${stem}-${index + 2}${extension}`).find(
      (candidate) => !existingNames.has(candidate),
    ) ?? `${stem}-${Date.now()}${extension}`
  );
}

function findDirectory(tree: LibraryNode[], path: string): DirectoryNode | null {
  return (
    tree
      .filter((node): node is DirectoryNode => node.type === "directory")
      .flatMap((node) => [node, findDirectory(node.children, path)])
      .filter((node): node is DirectoryNode => Boolean(node))
      .find((node) => node.path === path) ?? null
  );
}

function childrenForPath(tree: LibraryNode[], path: string, libraryPath: string) {
  if (path === libraryPath) {
    return tree;
  }

  return findDirectory(tree, path)?.children ?? tree;
}

function libraryTreesEqual(left: LibraryNode[], right: LibraryNode[]) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isPathInside(parentPath: string, childPath: string | null) {
  if (!childPath) {
    return false;
  }

  const parent = parentPath.replace(/[\\/]+$/, "");
  return (
    childPath === parent ||
    childPath.startsWith(`${parent}/`) ||
    childPath.startsWith(`${parent}\\`)
  );
}

type LibraryState = {
  libraryPath: string | null;
  selectedNotebookPath: string | null;
  tree: LibraryNode[];
  status: LibraryStatus;
  error: string | null;
  createLibrary: (name: string) => Promise<void>;
  createNote: (name: string, parentPath?: string | null) => Promise<void>;
  createNotebook: (name: string, parentPath?: string | null) => Promise<void>;
  deleteNote: (path: string) => Promise<void>;
  deleteNotebook: (path: string) => Promise<void>;
  openLibrary: (path?: string) => Promise<void>;
  closeLibrary: () => void;
  reload: () => Promise<void>;
  selectNotebook: (path: string | null) => void;
};

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      libraryPath: null,
      selectedNotebookPath: null,
      tree: [],
      status: "idle",
      error: null,
      createNote: async (name, parentPath) => {
        const libraryPath = get().libraryPath;
        if (!libraryPath) {
          set({ status: "error", error: "Open a library before creating a note." });
          return;
        }

        const fileName = noteFileName(name);
        if (!fileName) {
          set({ status: "error", error: "Choose a note name before creating it." });
          return;
        }

        const currentParentPath = dirname(useEditorStore.getState().currentFilePath ?? "");
        const targetPath =
          parentPath ??
          get().selectedNotebookPath ??
          (currentParentPath && currentParentPath !== libraryPath
            ? currentParentPath
            : libraryPath);
        const noteName = uniqueChildName(
          fileName,
          childrenForPath(get().tree, targetPath, libraryPath),
        );
        const notePath = joinPath(targetPath, noteName);
        set({ status: "loading", error: null });

        try {
          await writeTextFile(notePath, noteContent(name));
          set({
            selectedNotebookPath:
              targetPath === libraryPath ? get().selectedNotebookPath : targetPath,
            tree: await readLibraryTree(libraryPath),
            status: "ready",
          });
          await useEditorStore.getState().openFile(notePath);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          set({ status: "error", error: `Failed to create note: ${message}` });
        }
      },
      createNotebook: async (name, parentPath) => {
        const libraryPath = get().libraryPath;
        if (!libraryPath) {
          set({ status: "error", error: "Open a library before creating a notebook." });
          return;
        }

        const folderName = libraryFolderName(name);
        if (!folderName) {
          set({ status: "error", error: "Choose a notebook name before creating it." });
          return;
        }

        const targetPath = parentPath ?? get().selectedNotebookPath ?? libraryPath;
        const notebookName = uniqueChildName(
          folderName,
          childrenForPath(get().tree, targetPath, libraryPath),
        );
        const notebookPath = joinPath(targetPath, notebookName);
        const notePath = joinPath(notebookPath, "untitled.md");
        set({ status: "loading", error: null });

        try {
          await mkdir(notebookPath);
          await writeTextFile(notePath, noteContent("Untitled"));
          set({
            selectedNotebookPath: notebookPath,
            tree: await readLibraryTree(libraryPath),
            status: "ready",
          });
          await useEditorStore.getState().openFile(notePath);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          set({ status: "error", error: `Failed to create notebook: ${message}` });
        }
      },
      deleteNote: async (path) => {
        const libraryPath = get().libraryPath;
        if (!libraryPath) {
          set({ status: "error", error: "Open a library before deleting a note." });
          return;
        }

        set({ status: "loading", error: null });

        try {
          await remove(path);
          if (useEditorStore.getState().currentFilePath === path) {
            useEditorStore.getState().reset();
          }
          set({ tree: await readLibraryTree(libraryPath), status: "ready" });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          set({ status: "error", error: `Failed to delete note: ${message}` });
        }
      },
      deleteNotebook: async (path) => {
        const libraryPath = get().libraryPath;
        if (!libraryPath) {
          set({ status: "error", error: "Open a library before deleting a notebook." });
          return;
        }

        set({ status: "loading", error: null });

        try {
          await remove(path, { recursive: true });
          if (isPathInside(path, useEditorStore.getState().currentFilePath)) {
            useEditorStore.getState().reset();
          }
          set({
            selectedNotebookPath: isPathInside(path, get().selectedNotebookPath)
              ? null
              : get().selectedNotebookPath,
            tree: await readLibraryTree(libraryPath),
            status: "ready",
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          set({ status: "error", error: `Failed to delete notebook: ${message}` });
        }
      },
      createLibrary: async (name) => {
        const folderName = libraryFolderName(name);
        if (!folderName) {
          set({ status: "error", error: "Choose a library name before creating it." });
          return;
        }

        set({ status: "loading", error: null });

        try {
          await mkdir(await getDefaultLibraryRoot(), { recursive: true });
          const libraryPath = await getDefaultLibraryPath(folderName);
          await mkdir(libraryPath);
          await get().openLibrary(libraryPath);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          set({ status: "error", error: `Failed to create library: ${message}` });
        }
      },
      openLibrary: async (path) => {
        const currentLibraryPath = get().libraryPath;
        let resolvedPath = path;
        if (!resolvedPath) {
          const selected = await openDialog({ directory: true });
          if (!selected || typeof selected !== "string") {
            return;
          }
          resolvedPath = selected;
        }
        if (resolvedPath !== currentLibraryPath) {
          useEditorStore.getState().reset();
        }
        set({
          libraryPath: resolvedPath,
          selectedNotebookPath: null,
          status: "loading",
          error: null,
        });
        try {
          let tree = await readLibraryTree(resolvedPath);
          if (tree.length === 0) {
            await writeTextFile(joinPath(resolvedPath, "welcome.md"), WELCOME_NOTE);
            tree = await readLibraryTree(resolvedPath);
          }
          useRecentLibrariesStore.getState().pushRecent(resolvedPath);
          set({ tree, status: "ready" });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          set({ status: "error", error: message });
        }
      },
      closeLibrary: () => {
        useEditorStore.getState().reset();
        set({
          libraryPath: null,
          selectedNotebookPath: null,
          tree: [],
          status: "idle",
          error: null,
        });
      },
      reload: async () => {
        const path = get().libraryPath;
        if (!path) {
          return;
        }
        try {
          const tree = await readLibraryTree(path);
          if (get().libraryPath !== path || libraryTreesEqual(get().tree, tree)) {
            return;
          }

          set({ tree });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          set({ status: "error", error: message });
        }
      },
      selectNotebook: (path) => set({ selectedNotebookPath: path }),
    }),
    {
      name: "rune.library",
      storage: createJSONStorage(() => tauriStoreStorage),
      partialize: (state) => ({ libraryPath: state.libraryPath }),
      onRehydrateStorage: () => (state) => {
        if (state?.libraryPath) {
          void state.openLibrary(state.libraryPath);
        }
      },
    },
  ),
);
