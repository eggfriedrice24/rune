import { readTextFile, rename, writeTextFile } from "@tauri-apps/plugin-fs";
import { create } from "zustand";

type EditorStatus = "idle" | "loading" | "ready" | "saving" | "error";

export type EditorLocation = {
  column: number;
  line: number;
};

export type EditorCursorTarget = EditorLocation & {
  requestId: number;
};

const LOCAL_EDIT_REFRESH_GRACE_MS = 10000;

function wasRecentlyEdited(lastLocalEditAt: number | null) {
  return lastLocalEditAt !== null && Date.now() - lastLocalEditAt < LOCAL_EDIT_REFRESH_GRACE_MS;
}

function cursorTargetFromLocation(location: EditorLocation): EditorCursorTarget {
  return { ...location, requestId: Date.now() + Math.random() };
}

type EditorState = {
  currentFilePath: string | null;
  content: string;
  cursorTarget: EditorCursorTarget | null;
  isDirty: boolean;
  lastLocalEditAt: number | null;
  status: EditorStatus;
  error: string | null;
  openFile: (path: string) => Promise<void>;
  openFileAtLocation: (path: string, location: EditorLocation) => Promise<void>;
  refreshCurrentFileFromDisk: () => Promise<void>;
  updateContent: (content: string) => void;
  saveCurrentFile: () => Promise<boolean>;
  reset: () => void;
};

export const useEditorStore = create<EditorState>()((set, get) => ({
  currentFilePath: null,
  content: "",
  cursorTarget: null,
  isDirty: false,
  lastLocalEditAt: null,
  status: "idle",
  error: null,
  openFile: (path) => get().openFileAtLocation(path, { column: 0, line: 1 }),
  openFileAtLocation: async (path, location) => {
    const currentState = get();
    if (path === currentState.currentFilePath && currentState.status !== "error") {
      set({ cursorTarget: cursorTargetFromLocation(location) });
      return;
    }

    if (currentState.currentFilePath && currentState.isDirty) {
      const didSave = await currentState.saveCurrentFile();
      if (!didSave) {
        return;
      }
    }

    set({
      currentFilePath: path,
      cursorTarget: null,
      status: "loading",
      error: null,
      lastLocalEditAt: null,
    });

    try {
      const content = await readTextFile(path);
      set({
        currentFilePath: path,
        content,
        cursorTarget: cursorTargetFromLocation(location),
        isDirty: false,
        lastLocalEditAt: null,
        status: "ready",
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ status: "error", error: message });
    }
  },
  refreshCurrentFileFromDisk: async () => {
    const state = get();
    const currentFilePath = state.currentFilePath;
    if (
      !currentFilePath ||
      state.isDirty ||
      state.status === "loading" ||
      state.status === "saving"
    ) {
      return;
    }

    try {
      const content = await readTextFile(currentFilePath);
      const latestState = get();
      if (
        latestState.currentFilePath !== currentFilePath ||
        latestState.isDirty ||
        latestState.status === "loading" ||
        latestState.status === "saving" ||
        latestState.content === content
      ) {
        return;
      }

      if (wasRecentlyEdited(latestState.lastLocalEditAt)) {
        set({ isDirty: true, status: "ready", error: null });
        return;
      }

      set({ content, isDirty: false, lastLocalEditAt: null, status: "ready", error: null });
    } catch (err) {
      const latestState = get();
      if (latestState.currentFilePath !== currentFilePath || latestState.isDirty) {
        return;
      }

      const message = err instanceof Error ? err.message : String(err);
      set({ status: "error", error: message });
    }
  },
  updateContent: (content) => {
    if (content === get().content) {
      return;
    }

    set({ content, isDirty: true, lastLocalEditAt: Date.now(), status: "ready", error: null });
  },
  saveCurrentFile: async () => {
    const currentFilePath = get().currentFilePath;
    if (!currentFilePath) {
      return false;
    }

    const content = get().content;
    if (!get().isDirty) {
      return true;
    }

    const tempPath = `${currentFilePath}.tmp`;
    set({ status: "saving", error: null });

    try {
      await writeTextFile(tempPath, content);
      await rename(tempPath, currentFilePath);
      set((state) =>
        state.currentFilePath === currentFilePath && state.content === content
          ? { isDirty: false, status: "ready", error: null }
          : { status: "ready", error: null },
      );
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ status: "error", error: message });
      return false;
    }
  },
  reset: () =>
    set({
      currentFilePath: null,
      content: "",
      cursorTarget: null,
      isDirty: false,
      lastLocalEditAt: null,
      status: "idle",
      error: null,
    }),
}));
