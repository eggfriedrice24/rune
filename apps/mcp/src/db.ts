import { Database } from "bun:sqlite";
import { mkdir } from "node:fs/promises";
import nodePath from "node:path";

import type { RuneDb, SqlRow, SqlValue } from "@rune/db";

type OpenRuneDb = RuneDb & {
  close: () => void;
};

export async function withLibraryIndexDb<T>(
  libraryPath: string,
  fn: (db: RuneDb) => T | Promise<T>,
) {
  await mkdir(nodePath.join(libraryPath, ".rune"), { recursive: true });
  const db = openRuneDb(nodePath.join(libraryPath, ".rune", "index.db"));

  try {
    return await fn(db);
  } finally {
    db.close();
  }
}

function openRuneDb(path: string): OpenRuneDb {
  const database = new Database(path, { create: true });

  return {
    run: (sql, params = []) => {
      database.query(sql).run(...paramsFrom(params));
    },
    all: (sql, params = []) =>
      database
        .query(sql)
        .all(...paramsFrom(params))
        .map(rowFromUnknown),
    transaction: (fn) => database.transaction(fn)(),
    close: () => database.close(),
  };
}

function paramsFrom(params: readonly SqlValue[]) {
  return [...params];
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
