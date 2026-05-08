---
name: rune persistence layers
description: Three distinct persistence layers in rune (library files / library SQLite index / Tauri Store for app settings) and what belongs where
type: project
originSessionId: 630c3ac1-31e6-4b00-942d-a2624ea063e0
---

rune has **three persistence layers**. Putting data in the wrong one is an architectural mistake; this memo locks the boundaries.

## 1. Library content - flat `.md` files on disk

The default library root is platform-specific: Linux/macOS use `~/notes/rune`; Windows uses `%USERPROFILE%\Documents\notes\rune`, resolved through the OS Documents directory rather than AppData.

A library is a folder under that root, for example `~/notes/rune/personal`, `~/notes/rune/work`, or `%USERPROFILE%\Documents\notes\rune\personal` on Windows. A notebook is a folder inside a library. A note is a plain `.md` file.

Library content is the **source of truth** for note content. It is always portable and always plain text. Read/write access happens via `@tauri-apps/plugin-fs` in the desktop app and via Node/Bun filesystem APIs in the MCP server.

Existing-folder opening can remain as an advanced/import path, but the primary app flow creates named libraries under the default root.

## 2. Library index - SQLite at `<library>/.rune/index.db`

**Per-library** derived data: file metadata, headings, links, tags, full-text search. **Rebuildable from #1** at any time. Drizzle schema lives in `packages/db`. Used for fast search/queries, never as source of truth.

If you switch libraries, the index changes with it.

## 3. App settings - Tauri Store plugin (`@tauri-apps/plugin-store`)

**Per-installation** preferences that survive library switches: keybindings, leader key, theme, default library root, last-opened library, recent libraries, sidebar widths, font choices, etc. Stored in OS app-config dir (`~/.config/rune/settings.json` on Linux, `~/Library/Application Support/dev.ikako.rune/` on macOS).

The Zustand store at `apps/desktop/src/lib/keybindings.ts` uses `persist` middleware with a custom storage adapter (`apps/desktop/src/lib/tauri-store-adapter.ts`) that wraps `LazyStore` from the plugin.

## Decision Rules

- **Library content and user-edited text** goes in flat files (#1). Never DB-only.
- **Per-library derived data** goes in the SQLite index (#2). Examples: note titles, backlinks, tags-of-this-note, search results.
- **Per-installation preferences** go in Tauri Store (#3). Examples: leader key, key bindings, theme, default library root, recent libraries.
- **Transient UI state** stays in in-memory Zustand without persist. Examples: current scroll position, open file, sidebar open/closed during session.

## How To Apply

- Classify new persistence by layer before implementing it.
- Do **not** mix concerns: never put settings in the library index, never put per-library derived data in Tauri Store, never make notes DB-only.
- New persistent settings should extend the existing pattern: a Zustand slice using `tauriStoreStorage` from `apps/desktop/src/lib/tauri-store-adapter.ts`.
