# @rune/desktop

The Tauri desktop app for rune.

This workspace owns the editor UI, library picker, keybinding system, Markdown preview, and Tauri app shell. Notes are written directly to plain `.md` files on disk.

## Development

Run from the repo root:

```bash
bun install
bun tauri:dev
```

Workspace-local commands are also available:

```bash
bun --cwd apps/desktop run dev
bun --cwd apps/desktop run build
bun --cwd apps/desktop run tauri:build
```

## Structure

- `src/features/library` contains library, notebook, and note filesystem UI.
- `src/features/editor` contains CodeMirror editor state and components.
- `src/features/preview` contains Markdown rendering.
- `src/components/ui` contains shared shadcn/ui primitives.
- `src-tauri` contains the Tauri 2 Rust shell and bundle metadata.
