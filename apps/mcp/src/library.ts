import { mkdir, readdir, rename, rm, rmdir, stat } from "node:fs/promises";
import { homedir, platform } from "node:os";
import nodePath from "node:path";

import { isMarkdownFile, libraryFolderName, shouldSkipEntry } from "@rune/core";

const WELCOME_NOTE = `# Welcome to rune

This is your first note.

- Write Markdown files anywhere in this library.
- Use notebooks to keep related notes together.
- rune will show notes in the sidebar automatically.
`;

export type LibraryInfo = {
  path: string | null;
  exists: boolean;
  notebookCount: number;
  noteCount: number;
};

export type NotebookEntry = {
  name: string;
  path: string;
  updatedAt: number;
};

export type NoteEntry = {
  name: string;
  notebook: string;
  path: string;
  size: number;
  updatedAt: number;
};

export function getDefaultLibraryRoot() {
  const home = homedir();
  if (!home) {
    throw new Error("Could not resolve the home directory.");
  }

  return platform() === "win32"
    ? nodePath.join(home, "Documents", "notes", "rune")
    : nodePath.join(home, "notes", "rune");
}

export function resolveLibraryPath(libraryPath: string) {
  const trimmed = libraryPath.trim();
  if (!trimmed) {
    throw new Error("Library path is required.");
  }

  if (trimmed === "~") {
    return homedir();
  }

  if (trimmed.startsWith("~/") || trimmed.startsWith("~\\")) {
    return nodePath.resolve(homedir(), trimmed.slice(2));
  }

  return nodePath.resolve(trimmed);
}

export async function getLibraryInfo(libraryPath: string | null): Promise<LibraryInfo> {
  if (!libraryPath) {
    return { exists: false, notebookCount: 0, noteCount: 0, path: null };
  }

  const resolvedPath = resolveLibraryPath(libraryPath);
  if (!(await isDirectory(resolvedPath))) {
    return { exists: false, notebookCount: 0, noteCount: 0, path: resolvedPath };
  }

  const [notebooks, notes] = await Promise.all([
    listNotebooks(resolvedPath),
    listNotes(resolvedPath),
  ]);

  return {
    exists: true,
    notebookCount: notebooks.length,
    noteCount: notes.length,
    path: resolvedPath,
  };
}

export async function createLibrary(input: {
  name: string;
  root?: string | undefined;
}): Promise<LibraryInfo> {
  const folderName = libraryFolderName(input.name);
  if (!folderName) {
    throw new Error("Choose a library name before creating it.");
  }

  const rootPath = resolveLibraryPath(input.root ?? getDefaultLibraryRoot());
  await mkdir(rootPath, { recursive: true });

  const libraryPath = nodePath.join(rootPath, folderName);
  await mkdir(libraryPath);
  await Bun.write(nodePath.join(libraryPath, "welcome.md"), WELCOME_NOTE);

  return getLibraryInfo(libraryPath);
}

export async function listNotebooks(libraryPath: string): Promise<NotebookEntry[]> {
  return (await readNotebooks(await assertLibraryDirectory(libraryPath))).toSorted(compareByPath);
}

export async function createNotebook(input: {
  libraryPath: string;
  name: string;
  parent?: string | undefined;
}): Promise<NotebookEntry> {
  const libraryPath = await assertLibraryDirectory(input.libraryPath);
  const parent = resolveInsideLibrary(libraryPath, input.parent ?? "", "Parent notebook", true);
  await assertDirectory(parent.absolutePath, "Parent notebook");

  const folderName = libraryFolderName(input.name);
  if (!folderName) {
    throw new Error("Choose a notebook name before creating it.");
  }

  const notebookPath = nodePath.join(parent.absolutePath, folderName);
  await mkdir(notebookPath);

  return notebookEntry(libraryPath, notebookPath);
}

export async function deleteNotebook(input: {
  libraryPath: string;
  path: string;
}): Promise<{ deleted: true; path: string }> {
  const libraryPath = await assertLibraryDirectory(input.libraryPath);
  const notebook = resolveInsideLibrary(libraryPath, input.path, "Notebook path", false);
  await assertDirectory(notebook.absolutePath, "Notebook");
  await rmdir(notebook.absolutePath);

  return { deleted: true, path: notebook.relativePath };
}

export async function listNotes(libraryPath: string, notebook = ""): Promise<NoteEntry[]> {
  const resolvedLibraryPath = await assertLibraryDirectory(libraryPath);
  const root = resolveInsideLibrary(resolvedLibraryPath, notebook, "Notebook path", true);
  await assertDirectory(root.absolutePath, "Notebook");

  return (await readNotes(resolvedLibraryPath, root.absolutePath)).toSorted(compareByPath);
}

export async function readNote(input: {
  libraryPath: string;
  notebook?: string | undefined;
  filename: string;
}): Promise<{ note: NoteEntry; content: string }> {
  const resolved = await resolveNote(input.libraryPath, input.notebook ?? "", input.filename);

  return {
    content: await Bun.file(resolved.absolutePath).text(),
    note: await noteEntry(resolved.libraryPath, resolved.absolutePath),
  };
}

export async function writeNote(input: {
  libraryPath: string;
  notebook?: string | undefined;
  filename: string;
  content: string;
}): Promise<NoteEntry> {
  const resolved = await resolveNote(input.libraryPath, input.notebook ?? "", input.filename, {
    noteMustExist: false,
  });
  const tempPath = `${resolved.absolutePath}.tmp-${process.pid}-${Date.now()}`;

  await Bun.write(tempPath, input.content);
  await rename(tempPath, resolved.absolutePath);

  return noteEntry(resolved.libraryPath, resolved.absolutePath);
}

export async function deleteNote(input: {
  libraryPath: string;
  notebook?: string | undefined;
  filename: string;
}): Promise<{ deleted: true; path: string }> {
  const resolved = await resolveNote(input.libraryPath, input.notebook ?? "", input.filename);
  await rm(resolved.absolutePath);

  return { deleted: true, path: relativeApiPath(resolved.libraryPath, resolved.absolutePath) };
}

async function readNotebooks(
  libraryPath: string,
  directoryPath = libraryPath,
): Promise<NotebookEntry[]> {
  return (
    await Promise.all(
      (
        await readableEntries(directoryPath)
      )
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          const entryPath = nodePath.join(directoryPath, entry.name);
          return [await notebookEntry(libraryPath, entryPath)].concat(
            await readNotebooks(libraryPath, entryPath),
          );
        }),
    )
  ).flat();
}

async function readNotes(libraryPath: string, directoryPath: string): Promise<NoteEntry[]> {
  return (
    await Promise.all(
      (
        await readableEntries(directoryPath)
      ).map(async (entry) => {
        const entryPath = nodePath.join(directoryPath, entry.name);
        if (entry.isDirectory()) {
          return readNotes(libraryPath, entryPath);
        }

        if (!entry.isFile() || !isMarkdownFile(entry.name)) {
          return [];
        }

        return [await noteEntry(libraryPath, entryPath)];
      }),
    )
  ).flat();
}

async function readableEntries(directoryPath: string) {
  return (await readdir(directoryPath, { withFileTypes: true })).filter(
    (entry) => !shouldSkipEntry(entry.name),
  );
}

async function notebookEntry(libraryPath: string, notebookPath: string): Promise<NotebookEntry> {
  return {
    name: nodePath.basename(notebookPath),
    path: relativeApiPath(libraryPath, notebookPath),
    updatedAt: (await stat(notebookPath)).mtimeMs,
  };
}

async function noteEntry(libraryPath: string, notePath: string): Promise<NoteEntry> {
  const relativePath = relativeApiPath(libraryPath, notePath);
  const noteStats = await stat(notePath);

  return {
    name: nodePath.basename(notePath),
    notebook: notebookPathFromNotePath(relativePath),
    path: relativePath,
    size: noteStats.size,
    updatedAt: noteStats.mtimeMs,
  };
}

async function resolveNote(
  libraryPath: string,
  notebookPath: string,
  filename: string,
  options: { noteMustExist: boolean } = { noteMustExist: true },
) {
  const resolvedLibraryPath = await assertLibraryDirectory(libraryPath);
  const notebook = resolveInsideLibrary(resolvedLibraryPath, notebookPath, "Notebook path", true);
  await assertDirectory(notebook.absolutePath, "Notebook");

  const noteFilename = normalizeNoteFilename(filename);
  const notePath = nodePath.join(notebook.absolutePath, noteFilename);
  assertInsideLibrary(resolvedLibraryPath, notePath, "Note path");

  if (options.noteMustExist && !(await isFile(notePath))) {
    throw new Error(`Note does not exist: ${relativeApiPath(resolvedLibraryPath, notePath)}`);
  }

  return {
    absolutePath: notePath,
    libraryPath: resolvedLibraryPath,
  };
}

function normalizeNoteFilename(filename: string) {
  const trimmed = filename.trim();
  if (!trimmed) {
    throw new Error("Note filename is required.");
  }

  if (trimmed.includes("/") || trimmed.includes("\\") || trimmed !== nodePath.basename(trimmed)) {
    throw new Error("Note filename must not include notebook path separators.");
  }

  if (shouldSkipEntry(trimmed)) {
    throw new Error("Note filename is reserved.");
  }

  if (!isMarkdownFile(trimmed)) {
    throw new Error("Note filename must end with .md.");
  }

  return trimmed;
}

function resolveInsideLibrary(
  libraryPath: string,
  relativePath: string,
  label: string,
  allowEmpty: boolean,
) {
  const normalizedPath = normalizeRelativePath(relativePath, label, allowEmpty);
  const absolutePath = normalizedPath ? nodePath.resolve(libraryPath, normalizedPath) : libraryPath;
  assertInsideLibrary(libraryPath, absolutePath, label);

  return {
    absolutePath,
    relativePath: normalizedPath ? nativePathToApiPath(normalizedPath) : "",
  };
}

function normalizeRelativePath(relativePath: string, label: string, allowEmpty: boolean) {
  const trimmed = relativePath.trim();
  if (!trimmed) {
    if (allowEmpty) {
      return "";
    }

    throw new Error(`${label} is required.`);
  }

  if (nodePath.isAbsolute(trimmed)) {
    throw new Error(`${label} must be relative to the active library.`);
  }

  const segments = trimmed.split(/[\\/]+/).filter(Boolean);
  if (!segments.length && allowEmpty) {
    return "";
  }

  const invalidSegment = segments.find(
    (segment) => segment === "." || segment === ".." || shouldSkipEntry(segment),
  );
  if (invalidSegment) {
    throw new Error(`${label} contains a reserved path segment: ${invalidSegment}`);
  }

  return nodePath.join(...segments);
}

async function assertLibraryDirectory(libraryPath: string) {
  const resolvedPath = resolveLibraryPath(libraryPath);
  await assertDirectory(resolvedPath, "Library");
  return resolvedPath;
}

async function assertDirectory(path: string, label: string) {
  if (!(await isDirectory(path))) {
    throw new Error(`${label} does not exist: ${path}`);
  }
}

function assertInsideLibrary(libraryPath: string, targetPath: string, label: string) {
  const relativePath = nodePath.relative(libraryPath, targetPath);
  if (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !nodePath.isAbsolute(relativePath))
  ) {
    return;
  }

  throw new Error(`${label} must stay inside the active library.`);
}

async function isDirectory(path: string) {
  return (await statsForPath(path))?.isDirectory() ?? false;
}

async function isFile(path: string) {
  return await Bun.file(path).exists();
}

async function statsForPath(path: string) {
  try {
    return await stat(path);
  } catch (error) {
    if (errorCode(error) === "ENOENT") {
      return null;
    }

    throw error;
  }
}

function errorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : null;
}

function relativeApiPath(libraryPath: string, targetPath: string) {
  return nativePathToApiPath(nodePath.relative(libraryPath, targetPath));
}

function nativePathToApiPath(path: string) {
  return path.split(nodePath.sep).filter(Boolean).join("/");
}

function notebookPathFromNotePath(path: string) {
  const separatorIndex = path.lastIndexOf("/");
  return separatorIndex === -1 ? "" : path.slice(0, separatorIndex);
}

function compareByPath(a: { path: string }, b: { path: string }) {
  return a.path.localeCompare(b.path);
}
