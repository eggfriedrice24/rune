import type { LibraryNode } from "./types.ts";

export function basename(path: string): string {
  const cleaned = path.replace(/[\\/]+$/, "");
  const idx = Math.max(cleaned.lastIndexOf("/"), cleaned.lastIndexOf("\\"));
  return idx === -1 ? cleaned : cleaned.slice(idx + 1);
}

export function joinPath(base: string, name: string): string {
  const childName = name.replace(/^[\\/]+/, "");
  if (base.endsWith("/") || base.endsWith("\\")) {
    return `${base}${childName}`;
  }

  return `${base}${base.includes("\\") ? "\\" : "/"}${childName}`;
}

export function nodeName(node: LibraryNode): string {
  return node.name;
}
