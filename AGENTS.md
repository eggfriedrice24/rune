# AGENTS.md

## Project Snapshot

**rune** is a local-first markdown note-taking desktop app. Notes live as plain `.md` files on disk; no accounts, no
cloud, no telemetry. The app needs zero internet to function.

An optional, locally-spawned MCP server (`@rune/mcp`) lets AI agents (Claude Code, Codex, OpenCode, etc.) read and edit
notes in the same vault. MCP is a local IPC protocol; the server itself makes no network calls. Whether the connected
agent reaches a cloud LLM is the user's choice, not rune's.

This repository is an early WIP. Proposing sweeping changes that improve long-term maintainability is encouraged.

## Stack

- **Desktop**: Tauri 2 + Vite + React 19 + TypeScript + CodeMirror 6
- **MCP server**: Bun + TypeScript, published as `@rune/mcp`
- **UI**: shadcn/ui + Tailwind v4 (use the `/shadcn` skill when adding components)
- **State**: Zustand
- **Markdown**: `unified` + `remark` + `rehype` for parsing and rendering
- **DB**: SQLite + Drizzle (schema lives in `packages/db`)
- **Tooling**: bun workspaces + turborepo, oxlint + oxfmt (no eslint, no prettier)

## Hard Rules

- **Never use Next.js or any web-app framework.** This is a desktop app: pure React in Vite. No app router, no server
  components, no SSR.
- **Never use em dashes (-, U+2014) or en dashes (-, U+2013) in any output** (commit messages, PR descriptions, code
  comments, file content, docs). Use a regular hyphen-minus (`-`).
- **Flat `.md` files on disk are the source of truth.** SQLite is a derived index; it must be rebuildable from the vault
  folder. Notes stay portable.
- **Don't put I/O in `packages/core`.** Pure logic only, so the MCP server (Node `fs`) and the desktop app
  (`@tauri-apps/api/fs`) can share it.

## Task Completion Requirements

All of the following must pass before considering a task complete:

- `bun fmt`
- `bun lint`
- `bun typecheck`
- `bun test` (when tests exist for the touched code)

Run from the repo root unless a package-local script is required.

## Package Roles

- `apps/desktop`: Tauri 2 desktop app. Owns the editor UI, vault picker, keybinding system, and Tauri commands. Frontend
  in React + Vite + CodeMirror; backend in Rust.
- `apps/mcp`: Standalone MCP server. Reads/writes the vault folder directly, exposes tools to AI agents
  (`bunx @rune/mcp --vault ~/notes`).
- `packages/core`: I/O-agnostic markdown logic. Frontmatter, link resolution, headings, slugs, link graph. No `fs`, no
  Tauri APIs, no Bun-only APIs.
- `packages/db`: Drizzle schema, migrations, and query helpers for the SQLite index. Consumed by both apps via different
  drivers (better-sqlite3 in MCP, tauri-plugin-sql via sqlite-proxy in the desktop app).
- `packages/tsconfig`: Shared `tsconfig` presets (`base`, `react`, `node`).
- `packages/oxlint`: Shared oxlint config consumed by all packages.

## Storage Model

- The user picks a **vault folder** containing `.md` files (and arbitrary subdirectories). The folder is the canonical
  store.
- A SQLite database lives at `<vault>/.rune/index.db` and holds derived data: file metadata, headings, links, tags,
  full-text search index.
- Editing a note writes the file first, then updates the index. If the index is missing or stale, it is rebuilt from
  disk.
- The MCP server operates on the same vault concurrently; both processes use file watchers and treat the disk as
  canonical.

## UI Model

Three independent toggles, all bound to a user-configurable leader key:

- **Sidebar** (vault file tree, left). Default `leader+b`. Hidden by default.
- **Preview pane** (rendered markdown, right). Default `leader+p`. Hidden by default.
- **Reading mode** (preview replaces the editor full-window). Separate toggle.

The main editor component is `<Editor>`. The preview component is `<PreviewPane>`. The full-window preview view is
"reading mode".

## Style Guide

### General

- Keep things in one function unless composable or reusable.
- Avoid `try`/`catch` where possible. Prefer Result-style returns or letting errors bubble.
- **NEVER USE** the `any` type. type everything properly, for external stuff check types they ship, check node_modules
  if you have to, absolute worst case scenario is "unknown" - this is super specific if needed only.
- **IMPORTANT** Rely on type inference. Avoid explicit annotations or interfaces unless required for exports or clarity.
- Prefer functional array methods (`flatMap`, `filter`, `map`) over `for` loops. Use type guards on `filter` to preserve
  narrowing downstream.
- Reduce variable count by inlining values used once.
- Prefer Bun APIs (e.g. `Bun.file`) inside `apps/mcp`. The desktop app frontend uses Tauri APIs; the Rust side uses Rust
  idioms.

### Destructuring

Avoid unnecessary destructuring. Use dot notation to preserve context.

### Variables

Prefer `const`. Use ternaries or early returns instead of reassignment.

### Control Flow

Avoid `else`. Prefer early returns.

### Drizzle Schemas

Use snake_case for field names so column names don't need to be redefined as strings.

```ts
const note = sqliteTable("note", {
  id: text().primaryKey(),
  vault_path: text().notNull(),
  title: text().notNull(),
  updated_at: integer().notNull(),
});
```

### Comments

Default to no comments. Only write a comment when the _why_ is non-obvious (a hidden constraint, a workaround, a subtle
invariant). Never explain _what_ the code does; well-named identifiers do that.

## Testing

- Avoid mocks. Test the actual implementation.
- Tests live next to the code they cover (`foo.ts` + `foo.test.ts`) or in a package-local `test/` directory.
- Run tests from the package directory, not the repo root.
- For the MCP server, integration tests should hit a real temp vault on disk.

## Tooling Notes

- **oxlint**: type-aware. Runs at the repo root (`bun lint`).
- **oxfmt**: replaces prettier. `bun fmt` formats, `bun fmt:check` verifies.
- **No eslint, no prettier.** Don't add them, don't add their configs.
- **turbo**: orchestrates `build`, `typecheck`, `test` across packages. `dev` is per-app and not turbo-orchestrated.
- **bun workspaces with `catalog:`**: shared dep versions live in the root `package.json` `workspaces.catalog`.
  Workspace `package.json` files reference them as `"react": "catalog:"`.
- **bunfig.toml**: `[install] exact = true` so installs pin to exact versions.

## Working Style

- Always use parallel tools when applicable.
- Prefer automation: execute requested actions without confirmation unless blocked by missing info or
  safety/irreversibility.
- When adding UI components, use the `/shadcn` skill rather than hand-rolling.
- When in doubt about a Tauri API, check the official docs at https://tauri.app/develop/.
