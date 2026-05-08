const FILESYSTEM_RESERVED_CHARS = new Set(["<", ">", ":", '"', "/", "\\", "|", "?", "*"]);

const WINDOWS_RESERVED_NAMES = new Set([
  "aux",
  "com1",
  "com2",
  "com3",
  "com4",
  "com5",
  "com6",
  "com7",
  "com8",
  "com9",
  "con",
  "lpt1",
  "lpt2",
  "lpt3",
  "lpt4",
  "lpt5",
  "lpt6",
  "lpt7",
  "lpt8",
  "lpt9",
  "nul",
  "prn",
]);

export function libraryFolderName(name: string): string | null {
  const folderName = Array.from(name.trim(), (char) =>
    char.charCodeAt(0) < 32 || FILESYSTEM_RESERVED_CHARS.has(char) ? " " : char,
  )
    .join("")
    .replace(/\s+/g, "-")
    .replace(/^[. -]+|[. -]+$/g, "")
    .toLowerCase();

  if (!folderName) {
    return null;
  }

  return WINDOWS_RESERVED_NAMES.has(folderName) ? `${folderName}-library` : folderName;
}

export function noteFileName(name: string): string | null {
  const fileName = libraryFolderName(name.replace(/\.md$/i, ""));
  return fileName ? `${fileName}.md` : null;
}
