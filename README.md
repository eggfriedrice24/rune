# rune

AI-native, local-first markdown notes.

rune is a desktop note-taking app where your notes stay as plain `.md` files on disk. The desktop editor is for direct writing, and the local MCP server lets an AI agent create and edit notes in the same library.

No accounts. No cloud sync. No telemetry. The app does not need internet access to function.

## Status

rune is early preview software. The desktop app can create libraries, create notebooks and notes, edit Markdown with CodeMirror, auto-save to disk, and render a live preview. The MCP server is included and is being developed as the second creation surface.

## Concepts

- A library is a curated top-level notes folder.
- A notebook is a folder inside a library.
- A note is a plain `.md` file.
- The optional SQLite index under `<library>/.rune` is derived from the files and can be rebuilt.

## Features

- Local-first Markdown storage with portable plain-text files.
- Library-first setup that creates notes under `~/notes/rune` on Linux and macOS, and under the Documents folder on Windows.
- CodeMirror 6 editor with Markdown support and debounced auto-save.
- Live Markdown preview pane and reading mode.
- Keyboard-driven UI with configurable leader-key shortcuts.
- Local MCP server for agent-created notes and notebooks.

## Install

Download the latest desktop builds from [GitHub Releases](https://github.com/eggfriedrice24/rune/releases).

Linux AppImage builds may need distro-specific WebKitGTK and graphics setup. If the AppImage does not start on your distro, build from source for now.

## Run From Source

Install [Bun](https://bun.sh/) and the platform dependencies required by [Tauri 2](https://tauri.app/start/prerequisites/), then run:

```bash
bun install
bun tauri:dev
```

Useful project commands:

```bash
bun fmt
bun lint
bun typecheck
bun test
bun build
```

Run the MCP server locally:

```bash
bun --cwd apps/mcp run dev -- --help
bun --cwd apps/mcp run dev -- --library ~/notes/rune/personal
```

## Project Layout

- `apps/desktop` is the Tauri 2 desktop app built with Vite, React, TypeScript, CodeMirror 6, shadcn/ui, and Tailwind v4.
- `apps/mcp` is the Bun-powered local MCP server for note and notebook tools.
- `packages/core` contains shared, I/O-free Markdown and library logic.
- A future `packages/db` package will own the derived SQLite index layer.

## Privacy

rune stores notes on your machine. The MCP server communicates over local stdio and does not make network calls itself. If your AI agent uses a cloud model, that is controlled by the agent you connect to rune, not by rune itself.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, project boundaries, and pull request expectations.

## License

MIT. See [LICENSE](./LICENSE).
