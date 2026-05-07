import { readDir } from "@tauri-apps/plugin-fs";

import type { VaultNode } from "@/lib/vault";

const SKIP_NAMES = new Set([".rune", ".git", "node_modules", ".DS_Store"]);

function joinPath(base: string, name: string): string {
  return base.endsWith("/") ? `${base}${name}` : `${base}/${name}`;
}

async function readDirRecursive(path: string): Promise<VaultNode[]> {
  const entries = await readDir(path);
  const results = await Promise.all(
    entries.map(async (entry): Promise<VaultNode[]> => {
      if (entry.name.startsWith(".") || SKIP_NAMES.has(entry.name)) {
        return [];
      }
      const childPath = joinPath(path, entry.name);
      if (entry.isDirectory) {
        const children = await readDirRecursive(childPath);
        if (children.length === 0) {
          return [];
        }
        return [
          {
            name: entry.name,
            path: childPath,
            type: "directory",
            children,
          },
        ];
      }
      if (entry.isFile && entry.name.endsWith(".md")) {
        return [
          {
            name: entry.name,
            path: childPath,
            type: "file",
          },
        ];
      }
      return [];
    }),
  );
  return results.flat().sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

export async function readVaultTree(path: string): Promise<VaultNode[]> {
  return readDirRecursive(path);
}
