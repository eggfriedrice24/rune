import { afterEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import nodePath from "node:path";

import {
  createLibrary,
  createNotebook,
  deleteNote,
  deleteNotebook,
  listNotes,
  listNotebooks,
  readNote,
  writeNote,
} from "../src/library.ts";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

test("creates a library under the requested root", async () => {
  const root = await tempRoot();
  const library = await createLibrary({ name: "My Library", root });

  if (!library.path) {
    throw new Error("Expected created library path.");
  }

  expect(library).toMatchObject({
    exists: true,
    notebookCount: 0,
    noteCount: 1,
    path: nodePath.join(root, "my-library"),
  });
  expect((await readNote({ libraryPath: library.path, filename: "welcome.md" })).content).toContain(
    "# Welcome to rune",
  );
});

test("creates notebooks and writes notes inside existing notebooks", async () => {
  const libraryPath = await createTempLibrary();
  const notebook = await createNotebook({ libraryPath, name: "Ideas" });
  const note = await writeNote({
    libraryPath,
    notebook: notebook.path,
    filename: "first.md",
    content: "# First\n",
  });

  expect(notebook.path).toBe("ideas");
  expect(note.path).toBe("ideas/first.md");
  expect((await readNote({ libraryPath, notebook: "ideas", filename: "first.md" })).content).toBe(
    "# First\n",
  );
  expect((await listNotebooks(libraryPath)).map((entry) => entry.path)).toEqual(["ideas"]);
  expect((await listNotes(libraryPath, "ideas")).map((entry) => entry.path)).toEqual([
    "ideas/first.md",
  ]);

  await deleteNote({ libraryPath, notebook: "ideas", filename: "first.md" });
  expect(await listNotes(libraryPath, "ideas")).toEqual([]);

  await deleteNotebook({ libraryPath, path: "ideas" });
  expect(await listNotebooks(libraryPath)).toEqual([]);
});

test("lists markdown notes while skipping cruft", async () => {
  const libraryPath = await createTempLibrary();
  await mkdir(nodePath.join(libraryPath, "project"));
  await mkdir(nodePath.join(libraryPath, ".hidden"));
  await mkdir(nodePath.join(libraryPath, ".rune"));
  await Bun.write(nodePath.join(libraryPath, "project", "todo.md"), "# Todo\n");
  await Bun.write(nodePath.join(libraryPath, "project", "todo.txt"), "ignored\n");
  await Bun.write(nodePath.join(libraryPath, ".hidden", "secret.md"), "ignored\n");
  await Bun.write(nodePath.join(libraryPath, ".rune", "index.md"), "ignored\n");

  expect((await listNotes(libraryPath)).map((entry) => entry.path)).toEqual([
    "project/todo.md",
    "welcome.md",
  ]);
});

test("rejects note writes when the notebook is missing", async () => {
  await expectRejects(
    writeNote({
      libraryPath: await createTempLibrary(),
      notebook: "missing",
      filename: "draft.md",
      content: "# Draft\n",
    }),
    "Notebook does not exist",
  );
});

test("rejects paths that escape the library", async () => {
  const libraryPath = await createTempLibrary();

  await expectRejects(
    createNotebook({ libraryPath, name: "Outside", parent: ".." }),
    "reserved path segment",
  );
  await expectRejects(
    writeNote({
      libraryPath,
      notebook: "",
      filename: "../outside.md",
      content: "# Outside\n",
    }),
    "must not include notebook path separators",
  );
});

async function tempRoot() {
  const root = await mkdtemp(nodePath.join(tmpdir(), "rune-mcp-"));
  tempRoots.push(root);

  return root;
}

async function createTempLibrary() {
  const library = await createLibrary({ name: "Test Library", root: await tempRoot() });
  if (!library.path) {
    throw new Error("Expected created library path.");
  }

  return library.path;
}

async function expectRejects(promise: Promise<unknown>, message: string) {
  const error = await promise.then(
    () => null,
    (error: unknown) => error,
  );

  expect(error).toBeInstanceOf(Error);
  expect(error instanceof Error ? error.message : String(error)).toContain(message);
}
