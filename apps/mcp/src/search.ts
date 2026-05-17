import { titleFromMarkdown } from "@rune/core";
import {
  changedNoteMetadata,
  listIndexedNoteMetadata,
  rebuildNoteIndex,
  searchNoteIndex,
  syncNoteIndex,
  type NoteIndexMetadata,
  type NoteIndexRecord,
} from "@rune/db";

import { listNotes, readNote, type NoteEntry } from "./library.ts";
import { withLibraryIndexDb } from "./db.ts";

type SearchableNote = NoteIndexMetadata & Pick<NoteEntry, "name" | "notebook">;

export async function searchLibraryNotes(input: {
  libraryPath: string;
  query: string;
  limit?: number | undefined;
}) {
  const currentNotes = await noteIndexMetadata(input.libraryPath);

  return withLibraryIndexDb(input.libraryPath, async (db) => {
    const changedNotes = changedNoteMetadata(currentNotes, listIndexedNoteMetadata(db));
    const synced = syncNoteIndex(db, {
      changedNotes: await noteIndexRecordsForNotes(input.libraryPath, changedNotes),
      currentNotes,
    });

    return {
      query: input.query,
      changedNoteCount: synced.changedNoteCount,
      deletedNoteCount: synced.deletedNoteCount,
      indexedNoteCount: synced.indexedNoteCount,
      results: searchNoteIndex(
        db,
        input.query,
        input.limit === undefined ? {} : { limit: input.limit },
      ),
      unchangedNoteCount: synced.unchangedNoteCount,
    };
  });
}

export async function rebuildLibraryIndex(libraryPath: string) {
  const records = await noteIndexRecords(libraryPath);

  return withLibraryIndexDb(libraryPath, (db) => rebuildNoteIndex(db, records));
}

async function noteIndexRecords(libraryPath: string): Promise<NoteIndexRecord[]> {
  return noteIndexRecordsForNotes(libraryPath, await noteIndexMetadata(libraryPath));
}

async function noteIndexRecordsForNotes(
  libraryPath: string,
  notes: readonly SearchableNote[],
): Promise<NoteIndexRecord[]> {
  return Promise.all(
    notes.map(async (note) => {
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

async function noteIndexMetadata(libraryPath: string): Promise<SearchableNote[]> {
  return (await listNotes(libraryPath)).map((note) => ({
    name: note.name,
    notebook: note.notebook,
    path: note.path,
    size: note.size,
    updatedAt: Math.trunc(note.updatedAt),
  }));
}
