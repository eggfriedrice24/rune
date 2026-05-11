import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const notes = sqliteTable("notes", {
  path: text().primaryKey(),
  notebook: text().notNull(),
  name: text().notNull(),
  title: text().notNull(),
  size: integer().notNull(),
  updated_at: integer().notNull(),
});
