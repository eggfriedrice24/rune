# @rune/mcp

Local MCP server for rune markdown libraries.

The server exposes tools for AI agents to create libraries, create notebooks, list notes, read notes, write notes, search notes, and delete notes. It writes to the same plain `.md` files that the desktop app uses.

## Usage

Run against an existing library:

```bash
bunx @rune/mcp --library ~/notes/rune/personal
```

Show CLI help:

```bash
bunx @rune/mcp --help
```

Run from this repository during development:

```bash
bun --cwd apps/mcp run dev -- --library ~/notes/rune/personal
```

If no library is provided, call `library.create` from the connected MCP client before using note or notebook tools.

## Tools

- `library.info`
- `library.create`
- `notebook.list`
- `notebook.create`
- `notebook.delete`
- `note.list`
- `note.read`
- `note.search`
- `note.write`
- `note.delete`

`note.search` incrementally syncs the derived SQLite index at `<library>/.rune/index.db` before querying it. The index searches note paths, filenames, Markdown heading titles, and note body content.

## Privacy

The server runs locally over stdio. It does not make network calls itself.
