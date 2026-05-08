import { nodeName } from "./path.ts";
import type { VaultNode } from "./types.ts";

export function compareNodes(a: VaultNode, b: VaultNode): number {
  if (a.type !== b.type) {
    return a.type === "directory" ? -1 : 1;
  }

  return nodeName(a).localeCompare(nodeName(b));
}
