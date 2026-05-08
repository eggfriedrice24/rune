---
name: rune next-session plan (resume here)
description: Concrete plan for the next working session on rune; locked decisions, terminology, slice order, and remaining tasks
type: project
originSessionId: 630c3ac1-31e6-4b00-942d-a2624ea063e0
---

## Where We Are

- **Workspace bootstrapped**: bun + turborepo + oxlint/oxfmt, MIT, GitHub repo `eggfriedrice24/rune` (private).
- **Desktop app scaffolded** (`apps/desktop`): Vite + React 19 + TS + shadcn (preset `b3lWqx0UM` mira/mist/yellow + hugeicons + inter). Tauri 2 wrap with identifier `dev.ikako.rune`. Transparent window with translucent vibrancy panels.
- **Layout**: double-sidebar (left = `LibrarySidebar`, right = `PreviewSidebar`), main = `SidebarInset`. Two nested `SidebarProvider`s with controlled `open` state.
- **Keybindings**: TanStack Hotkeys + Zustand store at `apps/desktop/src/lib/keybindings.ts`. Persists via `tauri-plugin-store` adapter at `apps/desktop/src/lib/tauri-store-adapter.ts`. Default leader `Space`. Bound: `library.toggle (b)`, `preview.toggle (p)`, `reading.toggle (r)`, `library.open (o)`.
- **Library code**: filesystem-backed sidebar tree. Library-specific desktop code lives under `apps/desktop/src/features/library/{components,store,lib}`. Persists `libraryPath` only via Tauri Store; auto-opens last library on rehydration. `.md`-only filter, hides folders that recursively contain no `.md`, skips dotfiles + `.rune`/`.git`/`.DS_Store`/`node_modules`. Empty libraries are seeded with `welcome.md`, and successful opens are recorded in recent libraries.
- **Editor**: CodeMirror editor is installed and wired. File clicks open notes, active note is highlighted, and auto-save writes atomically with `.tmp` + `rename`.
- **Library-first UX**: first-run and empty states now lead with `Create library`. New libraries are created under the platform default root (`~/notes/rune` on Linux/macOS, `%USERPROFILE%\Documents\notes\rune` on Windows), seeded with `welcome.md`, opened immediately, and added to recent libraries. Existing-folder opening remains secondary.
- **No file watcher**: removed entirely because it caused CPU spikes on Linux/WebKitGTK during sidebar slide-in. Reintroduce only when MCP server external writes need it, with longer debounce and tree-equality short-circuit.

## Locked Positioning

- **rune is an AI-native note-taking app**, not a generic editor. Two equally first-class creation surfaces: the desktop editor and the MCP server. Both write to the same `.md` files on disk.
- **Roadmap priority**: editor first, MCP second. Both are first-class deliverables, neither relegated.
- **Primary product language is library, notebook, and note**. A library is the top-level curated note folder. A notebook is a folder inside a library. A note is a plain `.md` file. New code should use "library" unless referring to Bun workspace tooling.
- **Default library root is platform-specific**. Linux/macOS use `~/notes/rune`; Windows uses `%USERPROFILE%\Documents\notes\rune`, resolved through the OS Documents directory. New libraries are created under this root from a user-chosen name.
- **Primary UX is Create library, not Pick directory**. Existing-folder opening can remain as advanced/import, but it should not be the main first-run path.
- **Library content is flat `.md` files**. SQLite is only a derived per-library index at `<library>/.rune/index.db`.
- **Persistence layers**: library content = flat `.md` files. Per-library index = SQLite. App-installation state = Tauri Store.
- **Logic placement**: pure logic lives in `packages/core` so MCP server (Bun) and desktop can share it. Runtime-specific I/O stays per-app.
- **Stay TS-heavy**. Custom Rust commands only when there is a measured perf reason. Tauri plugins are already calling Rust under the hood.
- **Desktop src organization**: keep `components/ui`, shared infra (`src/lib`, shared hooks), and app-level shared components in their existing global locations. Only feature-specific desktop code goes under `src/features/<feature>/...`.

## Locked Editor Decisions

- **Auto-save on debounce** (~500ms after last keystroke) via `@tauri-apps/plugin-fs.writeTextFile`. Atomic write (`.tmp` + `rename`) for crash safety.
- **CodeMirror built-in light/dark theme initially**; map to rune's preset (mira/mist/yellow) as a polish pass later.
- **Defer vim mode**. `@replit/codemirror-vim` lands later as opt-in via setting.
- **Use `@uiw/react-codemirror`** rather than imperative mount.

## Completed Slices

### Slice 1: Library Management

- [x] `recent-libraries` store with Tauri Store persistence, capped to 8 entries.
- [x] Empty-library bootstrap via `welcome.md` plus recent-library recording on successful open.
- [x] `LibrarySwitcher` dropdown with recents, `Open existing library...`, and `Close library`.
- [x] `LibrarySidebar` header wired to `LibrarySwitcher`.
- [x] `bun fmt`, `bun lint`, and `bun typecheck` run after the slice. Lint warnings were pre-existing and outside this slice.
- [x] Library-specific desktop files moved under `apps/desktop/src/features/library/...` per the locked organization rule.

### Slice 2: Extract `packages/core`

- [x] Created `packages/core` as workspace package `@rune/core` with `package.json`, `tsconfig.json`, and `src/index.ts`.
- [x] Moved shared library types to `packages/core/src/library/types.ts`.
- [x] Moved pure library helpers (`SKIP_NAMES`, `shouldSkipEntry`, `isMarkdownFile`, `compareNodes`, `nodeName`, `basename`, `joinPath`) into `packages/core/src/library/{filter,sort,path}.ts` and re-exported them from `@rune/core`.
- [x] Added `@rune/core` to `apps/desktop` and updated the library feature to import shared types/helpers from it while keeping Tauri fs and Zustand code in desktop.
- [x] Saved the split in memory.

### Slice 3: CodeMirror Editor

- [x] Installed `@uiw/react-codemirror` + `@codemirror/lang-markdown` + `@codemirror/theme-one-dark` via catalog.
- [x] Added editor-specific desktop code under `apps/desktop/src/features/editor/{components,store}`.
- [x] `Editor` renders CodeMirror with Markdown support, line wrapping, and built-in light/dark themes.
- [x] Added a non-persistent editor store with `currentFilePath`, `content`, `isDirty`, `openFile(path)`, `saveCurrentFile()`, and `reset()`.
- [x] Library tree file clicks call `openFile(node.path)` and highlight the active note.
- [x] Auto-save runs on debounce and writes atomically with `.tmp` + `rename`.
- [x] `App.tsx` renders the real editor instead of the placeholder when a library is open.

### Slice 4: Library-First Desktop UX

- [x] Replaced the primary empty/first-run action with `Create library`.
- [x] Resolved the default library root from the OS: `~/notes/rune` on Linux/macOS, `%USERPROFILE%\Documents\notes\rune` on Windows.
- [x] Ensured the root exists before creating a library.
- [x] Created new libraries as child folders under the platform default root from a safe filesystem name.
- [x] Seeded new libraries with `welcome.md`, opened them immediately, and recorded them in recents.
- [x] Renamed internal code paths from old note-container terminology to `library` where practical.
- [x] Used `notebook` for folders inside a library in user-facing copy.
- [x] Kept `Open existing folder/library` as a secondary advanced/import action, not the primary first-run path.
- [x] Updated recents UI to behave like library switching.
- [x] Ran `bun fmt`, `bun lint`, and `bun typecheck`. `bun test` found no test files.

## Slice Order From Here

### Slice 5: MCP Server (`apps/mcp`)

- Build the server with Bun + TypeScript.
- Import `@rune/core` for shared pure types/policy.
- Align public tool language with libraries: `library.create`, `library.list_notes`, `library.read_note`, `library.write_note`, `library.delete_note`.
- Default `library.create` to the platform default root unless the caller explicitly provides a root.
- Use real temp library integration tests. Avoid mocks.
- Test loop: point Claude Code/OpenCode at the local server, ask it to write a note, and verify it appears in rune after watcher support is restored.

### Slice 6: Re-enable File Watcher

- Reintroduce `startLibraryWatcher` in `library-fs.ts` only after MCP writes are real.
- Use longer debounce (`delayMs: 2000`).
- Add tree-equality short-circuit in reload so identical trees do not trigger React updates. JSON-string compare is acceptable.
- Add `fs:allow-watch` permission + `['watch']` Cargo feature back.
- Test under realistic load: large library plus concurrent MCP edits.

## Pending Tasks

Slices 1, 2, 3, and 4 are complete. Next is Slice 5: MCP server.

## Things Not To Redo

- The default library root debate: locked at `~/notes/rune` for Linux/macOS and `%USERPROFILE%\Documents\notes\rune` for Windows.
- The product terminology debate: user-facing language is library, notebook, and note.
- The primary UX debate: create named library first, do not lead with arbitrary folder picking.
- The dash discussion: no em or en dashes in any output, file content, commit messages, PR descriptions, or comments.
- The watcher: do not bring it back without debounce + diff fixes.
- The `.gitignore` parsing rabbit hole: libraries are curated; do not filter for arbitrary repos.
- The Rust-vs-TS debate: stay TS-heavy with `packages/core` as the shared layer.
- The settings persistence rabbit hole: Tauri Store for app-level settings; flat files for library content; SQLite for derived per-library index.
