import { nodeName } from "./path.ts";
import type { LibraryNode } from "./types.ts";

export function compareNodes(a: LibraryNode, b: LibraryNode): number {
  if (a.type !== b.type) {
    return a.type === "directory" ? -1 : 1;
  }

  return nodeName(a).localeCompare(nodeName(b));
}
