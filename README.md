# rune

A local-first markdown note-taking desktop app.

Notes are plain `.md` files on disk. No accounts, no cloud, no telemetry. An optional, locally-spawned MCP server lets
AI agents (Claude Code, Codex, OpenCode, etc.) edit notes in the same library.

## Stack

- Tauri 2 + Vite + React + CodeMirror 6 (desktop)
- Bun + TypeScript (MCP server)
- shadcn/ui + Tailwind v4
- SQLite + Drizzle (search index)
- bun workspaces + turborepo, oxlint + oxfmt

See [AGENTS.md](./AGENTS.md) for conventions.
