import Database from "@tauri-apps/plugin-sql";
import { mkdir, readTextFile } from "@tauri-apps/plugin-fs";

import { basename, titleFromMarkdown, type LibraryNode } from "@rune/core";
import {
  rebuildNoteIndexAsync,
  searchNoteIndexAsync,
  type NoteIndexRecord,
  type SqlRow,
  type SqlValue,
} from "@rune/db";
import { readLibraryTree } from "@/features/library/lib/library-fs";

export type NoteSearchResult = {
  column: number;
  line: number;
  path: string;
  relativePath: string;
  name: string;
  title: string;
  snippet: string;
};

type SearchableNote = {
  path: string;
  relativePath: string;
  name: string;
};

type OpenLibraryIndexDb = {
  run: (sql: string, params?: readonly SqlValue[]) => Promise<void>;
  all: (sql: string, params?: readonly SqlValue[]) => Promise<SqlRow[]>;
  transaction: <T>(fn: () => Promise<T>) => Promise<T>;
  close: () => Promise<boolean>;
};

const DEFAULT_LIMIT = 8;
const TOKEN_PATTERN = /[\p{L}\p{N}_]+/gu;

export async function searchLibraryNotes(input: {
  libraryPath: string;
  query: string;
  limit?: number;
}): Promise<NoteSearchResult[]> {
  if (!input.query.trim()) {
    return [];
  }

  const db = await openLibraryIndex(input.libraryPath);
  try {
    await rebuildNoteIndexAsync(
      db,
      await noteIndexRecords(await readLibraryTree(input.libraryPath), input.libraryPath),
    );

    return Promise.all(
      (await searchNoteIndexAsync(db, input.query, { limit: input.limit ?? DEFAULT_LIMIT })).map(
        async (result) => {
          const path = absolutePath(input.libraryPath, result.path);
          const location = searchLocation(await readTextFile(path).catch(() => ""), input.query);

          return {
            column: location.column,
            line: location.line,
            path,
            relativePath: result.path,
            name: result.name,
            title: result.title,
            snippet: result.snippet || result.path,
          };
        },
      ),
    );
  } finally {
    await db.close();
  }
}

function searchLocation(content: string, query: string) {
  const tokens = (query.match(TOKEN_PATTERN) ?? []).map((token) => token.toLowerCase());
  if (!tokens.length) {
    return { column: 0, line: 1 };
  }

  const lines = content.split(/\r?\n/);
  const exactLineIndex = lines.findIndex((line) =>
    tokens.every((token) => line.toLowerCase().includes(token)),
  );
  const fallbackLineIndex =
    exactLineIndex === -1
      ? lines.findIndex((line) => tokens.some((token) => line.toLowerCase().includes(token)))
      : exactLineIndex;

  if (fallbackLineIndex === -1) {
    return { column: 0, line: 1 };
  }

  return {
    column: firstTokenColumn(lines[fallbackLineIndex] ?? "", tokens),
    line: fallbackLineIndex + 1,
  };
}

function firstTokenColumn(line: string, tokens: readonly string[]) {
  const lowerLine = line.toLowerCase();
  const columns = tokens
    .map((token) => lowerLine.indexOf(token))
    .filter((column) => column !== -1)
    .toSorted((a, b) => a - b);

  return columns[0] ?? 0;
}

async function noteIndexRecords(
  nodes: LibraryNode[],
  libraryPath: string,
): Promise<NoteIndexRecord[]> {
  return (
    await Promise.all(
      noteEntries(nodes, libraryPath).map(async (note) => {
        const content = await readTextFile(note.path).catch(() => null);
        if (content === null) {
          return null;
        }

        return {
          path: note.relativePath,
          notebook: notebookPathFromNotePath(note.relativePath),
          name: note.name,
          title: titleFromMarkdown(content, basename(note.path)),
          content,
          size: content.length,
          updatedAt: Date.now(),
        };
      }),
    )
  ).filter((record): record is NoteIndexRecord => Boolean(record));
}

function noteEntries(nodes: LibraryNode[], libraryPath: string): SearchableNote[] {
  return nodes.flatMap((node): SearchableNote[] => {
    if (node.type === "file") {
      return [
        {
          path: node.path,
          relativePath: relativePath(libraryPath, node.path),
          name: node.name,
        },
      ];
    }

    return noteEntries(node.children, libraryPath);
  });
}

function relativePath(libraryPath: string, path: string) {
  return path
    .slice(libraryPath.length)
    .replace(/^[\\/]+/, "")
    .replace(/\\/g, "/");
}

async function openLibraryIndex(libraryPath: string): Promise<OpenLibraryIndexDb> {
  await mkdir(`${libraryPath}/.rune`, { recursive: true });
  const database = await Database.load(`sqlite:${libraryPath}/.rune/index.db`);

  return {
    run: async (sql, params = []) => {
      await database.execute(sql, paramsFrom(params));
    },
    all: async (sql, params = []) =>
      rowsFromUnknown(await database.select(sql, paramsFrom(params))),
    transaction: (fn) => fn(),
    close: () => database.close(),
  };
}

function paramsFrom(params: readonly SqlValue[]) {
  return [...params];
}

function rowsFromUnknown(value: unknown): SqlRow[] {
  if (!Array.isArray(value)) {
    throw new Error("SQLite query returned a non-array result.");
  }

  return value.map(rowFromUnknown);
}

function rowFromUnknown(value: unknown): SqlRow {
  if (!isRecord(value)) {
    throw new Error("SQLite query returned a non-object row.");
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, rowValue]) => [key, sqlValueFromUnknown(key, rowValue)]),
  );
}

function sqlValueFromUnknown(key: string, value: unknown): SqlValue {
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    return value;
  }

  if (value === null) {
    return null;
  }

  throw new Error(`SQLite query returned unsupported value for ${key}.`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function absolutePath(libraryPath: string, path: string) {
  return `${libraryPath.replace(/\/+$/, "")}/${path}`;
}

function notebookPathFromNotePath(path: string) {
  const separatorIndex = path.lastIndexOf("/");
  return separatorIndex === -1 ? "" : path.slice(0, separatorIndex);
}
