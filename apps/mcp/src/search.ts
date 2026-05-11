import { titleFromMarkdown } from "@rune/core";
import { rebuildNoteIndex, searchNoteIndex, type NoteIndexRecord } from "@rune/db";

import { listNotes, readNote } from "./library.ts";
import { withLibraryIndexDb } from "./db.ts";

export async function searchLibraryNotes(input: {
  libraryPath: string;
  query: string;
  limit?: number | undefined;
}) {
  const indexed = await rebuildLibraryIndex(input.libraryPath);
  const results = await withLibraryIndexDb(input.libraryPath, (db) =>
    searchNoteIndex(db, input.query, input.limit === undefined ? {} : { limit: input.limit }),
  );

  return {
    query: input.query,
    indexedNoteCount: indexed.noteCount,
    results,
  };
}

export async function rebuildLibraryIndex(libraryPath: string) {
  const records = await noteIndexRecords(libraryPath);

  return withLibraryIndexDb(libraryPath, (db) => rebuildNoteIndex(db, records));
}

async function noteIndexRecords(libraryPath: string): Promise<NoteIndexRecord[]> {
  return Promise.all(
    (await listNotes(libraryPath)).map(async (note) => {
      const content = (
        await readNote({
          libraryPath,
          notebook: note.notebook,
          filename: note.name,
        })
      ).content;

      return {
        path: note.path,
        notebook: note.notebook,
        name: note.name,
        title: titleFromMarkdown(content, note.name),
        content,
        size: note.size,
        updatedAt: Math.trunc(note.updatedAt),
      };
    }),
  );
}
