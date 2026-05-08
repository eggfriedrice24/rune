export const SKIP_NAMES = new Set([".rune", ".git", "node_modules", ".DS_Store"]);

export function shouldSkipEntry(name: string): boolean {
  return name.startsWith(".") || SKIP_NAMES.has(name);
}

export function isMarkdownFile(name: string): boolean {
  return name.endsWith(".md");
}
