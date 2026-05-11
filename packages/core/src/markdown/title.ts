const HEADING_PATTERN = /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/;

export function titleFromMarkdown(content: string, fallbackName: string) {
  return (
    content
      .split(/\r?\n/)
      .map((line) => line.match(HEADING_PATTERN)?.[1]?.trim())
      .find((title): title is string => Boolean(title)) ?? fallbackTitle(fallbackName)
  );
}

function fallbackTitle(name: string) {
  return name.replace(/\.md$/i, "").trim() || "Untitled";
}
