export type SqlValue = string | number | bigint | null;
export type SqlRow = Record<string, SqlValue>;

export type RuneDb = {
  run: (sql: string, params?: readonly SqlValue[]) => void;
  all: (sql: string, params?: readonly SqlValue[]) => SqlRow[];
  transaction: <T>(fn: () => T) => T;
};

export type AsyncRuneDb = {
  run: (sql: string, params?: readonly SqlValue[]) => Promise<void>;
  all: (sql: string, params?: readonly SqlValue[]) => Promise<SqlRow[]>;
  transaction: <T>(fn: () => Promise<T>) => Promise<T>;
};

export type NoteIndexRecord = {
  path: string;
  notebook: string;
  name: string;
  title: string;
  content: string;
  size: number;
  updatedAt: number;
};

export type NoteIndexMetadata = Pick<NoteIndexRecord, "path" | "size" | "updatedAt">;

export type NoteIndexSyncInput = {
  currentNotes: readonly NoteIndexMetadata[];
  changedNotes: readonly NoteIndexRecord[];
};

export type NoteIndexSyncResult = {
  changedNoteCount: number;
  deletedNoteCount: number;
  indexedNoteCount: number;
  unchangedNoteCount: number;
};

export type NoteSearchResult = {
  path: string;
  notebook: string;
  name: string;
  title: string;
  size: number;
  updatedAt: number;
  snippet: string;
};

const DEFAULT_SEARCH_LIMIT = 20;
const MAX_SEARCH_LIMIT = 50;
const TOKEN_PATTERN = /[\p{L}\p{N}_]+/gu;

export function initializeLibraryIndex(db: RuneDb) {
  libraryIndexSetupStatements().forEach((sql) => db.run(sql));
}

export async function initializeLibraryIndexAsync(db: AsyncRuneDb) {
  await runStatementsAsync(db, libraryIndexSetupStatements());
}

export function rebuildNoteIndex(db: RuneDb, notes: readonly NoteIndexRecord[]) {
  initializeLibraryIndex(db);
  db.transaction(() => {
    resetSearchTableStatements().forEach((sql) => db.run(sql));
    notes.forEach((note) => insertNoteIndexRecord(db, note));
  });

  return { noteCount: notes.length };
}

export async function rebuildNoteIndexAsync(db: AsyncRuneDb, notes: readonly NoteIndexRecord[]) {
  await initializeLibraryIndexAsync(db);
  await db.transaction(async () => {
    await runStatementsAsync(db, resetSearchTableStatements());
    await Promise.all(notes.map((note) => insertNoteIndexRecordAsync(db, note)));
  });

  return { noteCount: notes.length };
}

export function listIndexedNoteMetadata(db: RuneDb): NoteIndexMetadata[] {
  initializeLibraryIndex(db);

  return db.all("SELECT path, size, updated_at FROM notes").map(noteIndexMetadataFromRow);
}

export async function listIndexedNoteMetadataAsync(db: AsyncRuneDb): Promise<NoteIndexMetadata[]> {
  await initializeLibraryIndexAsync(db);

  return (await db.all("SELECT path, size, updated_at FROM notes")).map(noteIndexMetadataFromRow);
}

export function changedNoteMetadata<T extends NoteIndexMetadata>(
  currentNotes: readonly T[],
  indexedNotes: readonly NoteIndexMetadata[],
) {
  const indexedByPath = new Map(indexedNotes.map((note) => [note.path, note]));

  return currentNotes.filter((note) => {
    const indexed = indexedByPath.get(note.path);

    return !indexed || indexed.size !== note.size || indexed.updatedAt !== note.updatedAt;
  });
}

export function syncNoteIndex(db: RuneDb, input: NoteIndexSyncInput): NoteIndexSyncResult {
  initializeLibraryIndex(db);
  const indexedNotes = listIndexedNoteMetadata(db);
  const deletedPaths = deletedIndexedPaths(input.currentNotes, indexedNotes);

  db.transaction(() => {
    deletedPaths.forEach((path) => deleteNoteIndexRecord(db, path));
    input.changedNotes.forEach((note) => upsertNoteIndexRecord(db, note));
  });

  return noteIndexSyncResult(input, deletedPaths.length);
}

export async function syncNoteIndexAsync(
  db: AsyncRuneDb,
  input: NoteIndexSyncInput,
): Promise<NoteIndexSyncResult> {
  await initializeLibraryIndexAsync(db);
  const indexedNotes = await listIndexedNoteMetadataAsync(db);
  const deletedPaths = deletedIndexedPaths(input.currentNotes, indexedNotes);

  await db.transaction(async () => {
    await Promise.all(deletedPaths.map((path) => deleteNoteIndexRecordAsync(db, path)));
    await Promise.all(input.changedNotes.map((note) => upsertNoteIndexRecordAsync(db, note)));
  });

  return noteIndexSyncResult(input, deletedPaths.length);
}

export function searchNoteIndex(
  db: RuneDb,
  query: string,
  options: { limit?: number } = {},
): NoteSearchResult[] {
  const ftsQuery = searchQuery(query);
  if (!ftsQuery) {
    return [];
  }

  initializeLibraryIndex(db);

  return db
    .all(
      `SELECT
        notes.path,
        notes.notebook,
        notes.name,
        notes.title,
        notes.size,
        notes.updated_at,
        snippet(note_search, -1, '', '', '...', 18) AS snippet
      FROM note_search
      JOIN notes ON notes.path = note_search.path
      WHERE note_search MATCH ?
      ORDER BY rank
      LIMIT ?`,
      [ftsQuery, searchLimit(options.limit)],
    )
    .map(noteSearchResultFromRow);
}

export async function searchNoteIndexAsync(
  db: AsyncRuneDb,
  query: string,
  options: { limit?: number } = {},
): Promise<NoteSearchResult[]> {
  const ftsQuery = searchQuery(query);
  if (!ftsQuery) {
    return [];
  }

  await initializeLibraryIndexAsync(db);

  return (await db.all(searchSql(), [ftsQuery, searchLimit(options.limit)])).map(
    noteSearchResultFromRow,
  );
}

function searchQuery(query: string) {
  const tokens = query.match(TOKEN_PATTERN) ?? [];
  if (!tokens.length) {
    return null;
  }

  return tokens.map((token) => `"${token.replaceAll('"', '""')}"`).join(" ");
}

function searchLimit(limit: number | undefined) {
  const value = Math.trunc(limit ?? DEFAULT_SEARCH_LIMIT);
  if (!Number.isFinite(value)) {
    return DEFAULT_SEARCH_LIMIT;
  }

  return Math.min(Math.max(value, 1), MAX_SEARCH_LIMIT);
}

function noteSearchResultFromRow(row: SqlRow): NoteSearchResult {
  return {
    path: stringValue(row, "path"),
    notebook: stringValue(row, "notebook"),
    name: stringValue(row, "name"),
    title: stringValue(row, "title"),
    size: numberValue(row, "size"),
    updatedAt: numberValue(row, "updated_at"),
    snippet: nullableStringValue(row, "snippet") ?? "",
  };
}

function noteIndexMetadataFromRow(row: SqlRow): NoteIndexMetadata {
  return {
    path: stringValue(row, "path"),
    size: numberValue(row, "size"),
    updatedAt: numberValue(row, "updated_at"),
  };
}

function libraryIndexSetupStatements() {
  return [
    "PRAGMA foreign_keys = ON",
    "PRAGMA journal_mode = WAL",
    `CREATE TABLE IF NOT EXISTS notes (
      path TEXT PRIMARY KEY NOT NULL,
      notebook TEXT NOT NULL,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      size INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE VIRTUAL TABLE IF NOT EXISTS note_search USING fts5(
      path,
      name,
      title,
      content,
      tokenize = 'unicode61'
    )`,
  ];
}

function resetSearchTableStatements() {
  return [
    "DROP TABLE IF EXISTS note_search",
    `CREATE VIRTUAL TABLE note_search USING fts5(
      path,
      name,
      title,
      content,
      tokenize = 'unicode61'
    )`,
    "DELETE FROM notes",
  ];
}

function insertNoteIndexRecord(db: RuneDb, note: NoteIndexRecord) {
  db.run(
    `INSERT INTO notes (path, notebook, name, title, size, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [note.path, note.notebook, note.name, note.title, note.size, note.updatedAt],
  );
  db.run("INSERT INTO note_search (path, name, title, content) VALUES (?, ?, ?, ?)", [
    note.path,
    note.name,
    note.title,
    note.content,
  ]);
}

function upsertNoteIndexRecord(db: RuneDb, note: NoteIndexRecord) {
  db.run(
    `INSERT INTO notes (path, notebook, name, title, size, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(path) DO UPDATE SET
      notebook = excluded.notebook,
      name = excluded.name,
      title = excluded.title,
      size = excluded.size,
      updated_at = excluded.updated_at`,
    [note.path, note.notebook, note.name, note.title, note.size, note.updatedAt],
  );
  db.run("DELETE FROM note_search WHERE path = ?", [note.path]);
  db.run("INSERT INTO note_search (path, name, title, content) VALUES (?, ?, ?, ?)", [
    note.path,
    note.name,
    note.title,
    note.content,
  ]);
}

function deleteNoteIndexRecord(db: RuneDb, path: string) {
  db.run("DELETE FROM note_search WHERE path = ?", [path]);
  db.run("DELETE FROM notes WHERE path = ?", [path]);
}

async function insertNoteIndexRecordAsync(db: AsyncRuneDb, note: NoteIndexRecord) {
  await db.run(
    `INSERT INTO notes (path, notebook, name, title, size, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [note.path, note.notebook, note.name, note.title, note.size, note.updatedAt],
  );
  await db.run("INSERT INTO note_search (path, name, title, content) VALUES (?, ?, ?, ?)", [
    note.path,
    note.name,
    note.title,
    note.content,
  ]);
}

async function upsertNoteIndexRecordAsync(db: AsyncRuneDb, note: NoteIndexRecord) {
  await db.run(
    `INSERT INTO notes (path, notebook, name, title, size, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(path) DO UPDATE SET
      notebook = excluded.notebook,
      name = excluded.name,
      title = excluded.title,
      size = excluded.size,
      updated_at = excluded.updated_at`,
    [note.path, note.notebook, note.name, note.title, note.size, note.updatedAt],
  );
  await db.run("DELETE FROM note_search WHERE path = ?", [note.path]);
  await db.run("INSERT INTO note_search (path, name, title, content) VALUES (?, ?, ?, ?)", [
    note.path,
    note.name,
    note.title,
    note.content,
  ]);
}

async function deleteNoteIndexRecordAsync(db: AsyncRuneDb, path: string) {
  await db.run("DELETE FROM note_search WHERE path = ?", [path]);
  await db.run("DELETE FROM notes WHERE path = ?", [path]);
}

function deletedIndexedPaths(
  currentNotes: readonly NoteIndexMetadata[],
  indexedNotes: readonly NoteIndexMetadata[],
) {
  const currentPaths = new Set(currentNotes.map((note) => note.path));

  return indexedNotes.map((note) => note.path).filter((path) => !currentPaths.has(path));
}

function noteIndexSyncResult(
  input: NoteIndexSyncInput,
  deletedNoteCount: number,
): NoteIndexSyncResult {
  return {
    changedNoteCount: input.changedNotes.length,
    deletedNoteCount,
    indexedNoteCount: input.currentNotes.length,
    unchangedNoteCount: Math.max(input.currentNotes.length - input.changedNotes.length, 0),
  };
}

async function runStatementsAsync(db: AsyncRuneDb, statements: readonly string[]) {
  await statements.reduce(async (previous, sql) => {
    await previous;
    await db.run(sql);
  }, Promise.resolve());
}

function searchSql() {
  return `SELECT
    notes.path,
    notes.notebook,
    notes.name,
    notes.title,
    notes.size,
    notes.updated_at,
    snippet(note_search, -1, '', '', '...', 18) AS snippet
  FROM note_search
  JOIN notes ON notes.path = note_search.path
  WHERE note_search MATCH ?
  ORDER BY rank
  LIMIT ?`;
}

function stringValue(row: SqlRow, key: string) {
  const value = row[key];
  if (typeof value === "string") {
    return value;
  }

  throw new Error(`Expected string value for ${key}.`);
}

function nullableStringValue(row: SqlRow, key: string) {
  const value = row[key];
  if (typeof value === "string" || value === null) {
    return value;
  }

  throw new Error(`Expected nullable string value for ${key}.`);
}

function numberValue(row: SqlRow, key: string) {
  const value = row[key];
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  throw new Error(`Expected number value for ${key}.`);
}
