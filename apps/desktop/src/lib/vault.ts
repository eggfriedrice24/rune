import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { tauriStoreStorage } from "@/lib/tauri-store-adapter";
import { readVaultTree } from "@/lib/vault-fs";

export type FileNode = {
  name: string;
  path: string;
  type: "file";
};

export type DirectoryNode = {
  name: string;
  path: string;
  type: "directory";
  children: VaultNode[];
};

export type VaultNode = FileNode | DirectoryNode;

export type VaultStatus = "idle" | "loading" | "ready" | "error";

type VaultState = {
  vaultPath: string | null;
  tree: VaultNode[];
  status: VaultStatus;
  error: string | null;
  openVault: (path?: string) => Promise<void>;
  closeVault: () => void;
  reload: () => Promise<void>;
};

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      vaultPath: null,
      tree: [],
      status: "idle",
      error: null,
      openVault: async (path) => {
        let resolvedPath = path;
        if (!resolvedPath) {
          const selected = await openDialog({ directory: true });
          if (!selected || typeof selected !== "string") {
            return;
          }
          resolvedPath = selected;
        }
        set({ vaultPath: resolvedPath, status: "loading", error: null });
        try {
          const tree = await readVaultTree(resolvedPath);
          set({ tree, status: "ready" });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          set({ status: "error", error: message });
        }
      },
      closeVault: () => {
        set({ vaultPath: null, tree: [], status: "idle", error: null });
      },
      reload: async () => {
        const path = get().vaultPath;
        if (!path) {
          return;
        }
        try {
          const tree = await readVaultTree(path);
          set({ tree });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          set({ status: "error", error: message });
        }
      },
    }),
    {
      name: "rune.vault",
      storage: createJSONStorage(() => tauriStoreStorage),
      partialize: (state) => ({ vaultPath: state.vaultPath }),
      onRehydrateStorage: () => (state) => {
        if (state?.vaultPath) {
          void state.openVault(state.vaultPath);
        }
      },
    },
  ),
);
