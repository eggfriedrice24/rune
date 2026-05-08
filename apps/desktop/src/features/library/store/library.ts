import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { mkdir, writeTextFile } from "@tauri-apps/plugin-fs";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { joinPath, libraryFolderName, type LibraryNode, type LibraryStatus } from "@rune/core";
import { useEditorStore } from "@/features/editor/store/editor";
import { getDefaultLibraryPath, getDefaultLibraryRoot } from "@/features/library/lib/library-paths";
import { readLibraryTree } from "@/features/library/lib/library-fs";
import { useRecentLibrariesStore } from "@/features/library/store/recent-libraries";
import { tauriStoreStorage } from "@/lib/tauri-store-adapter";

const WELCOME_NOTE = `# Welcome to rune

This is your first note.

- Write Markdown files anywhere in this library.
- Use notebooks to keep related notes together.
- rune will show notes in the sidebar automatically.
`;

type LibraryState = {
  libraryPath: string | null;
  tree: LibraryNode[];
  status: LibraryStatus;
  error: string | null;
  createLibrary: (name: string) => Promise<void>;
  openLibrary: (path?: string) => Promise<void>;
  closeLibrary: () => void;
  reload: () => Promise<void>;
};

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      libraryPath: null,
      tree: [],
      status: "idle",
      error: null,
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
        set({ libraryPath: resolvedPath, status: "loading", error: null });
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
        set({ libraryPath: null, tree: [], status: "idle", error: null });
      },
      reload: async () => {
        const path = get().libraryPath;
        if (!path) {
          return;
        }
        try {
          const tree = await readLibraryTree(path);
          set({ tree });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          set({ status: "error", error: message });
        }
      },
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
