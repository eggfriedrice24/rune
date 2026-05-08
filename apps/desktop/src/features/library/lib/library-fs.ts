import { readDir } from "@tauri-apps/plugin-fs";

import {
  compareNodes,
  isMarkdownFile,
  joinPath,
  shouldSkipEntry,
  type LibraryNode,
} from "@rune/core";

async function readDirRecursive(path: string): Promise<LibraryNode[]> {
  const entries = await readDir(path);
  const results = await Promise.all(
    entries.map(async (entry): Promise<LibraryNode[]> => {
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

export async function readLibraryTree(path: string): Promise<LibraryNode[]> {
  return readDirRecursive(path);
}
