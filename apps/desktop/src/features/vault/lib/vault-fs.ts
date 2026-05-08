import { readDir } from "@tauri-apps/plugin-fs";

import {
  compareNodes,
  isMarkdownFile,
  joinPath,
  shouldSkipEntry,
  type VaultNode,
} from "@rune/core";

async function readDirRecursive(path: string): Promise<VaultNode[]> {
  const entries = await readDir(path);
  const results = await Promise.all(
    entries.map(async (entry): Promise<VaultNode[]> => {
      if (shouldSkipEntry(entry.name)) {
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
      if (entry.isFile && isMarkdownFile(entry.name)) {
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
  return results.flat().toSorted(compareNodes);
}

export async function readVaultTree(path: string): Promise<VaultNode[]> {
  return readDirRecursive(path);
}
