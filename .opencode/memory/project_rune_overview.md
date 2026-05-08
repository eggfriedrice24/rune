---
name: rune project overview
description: What rune is, its architecture, terminology, and durable design rules for the project
type: project
originSessionId: 630c3ac1-31e6-4b00-942d-a2624ea063e0
---

**rune** is an **AI-native, local-first markdown note-taking app**. Not a generic editor. Notes live as plain `.md` files on disk; no accounts, no cloud, no telemetry. The app itself needs zero internet to function.

**Two equally first-class creation surfaces**, both writing to the same library on disk:

1. **The desktop editor** (`apps/desktop`, CodeMirror 6). User writes and edits notes directly.
2. **The MCP server** (`apps/mcp`, published as `@rune/mcp`). The user's AI agent (Claude Code, Codex, OpenCode, etc.) creates libraries, drafts notes, edits content, and runs searches via MCP tool calls. This is rune's edge over Obsidian / Logseq / iA Writer: AI is a peer of the human editor, not a bolted-on plugin.

MCP is a local IPC protocol; the server makes no network calls itself. Whether the connected agent reaches a cloud LLM is the user's choice, not rune's.

**Roadmap priority**: editor first, MCP server second. Users still want to write directly; the agent is a force multiplier, not a replacement.

**Stack**: Tauri 2 + Vite + React 19 + TypeScript + CodeMirror 6, with bun + turborepo monorepo. Drizzle for SQLite. shadcn/ui for components. oxlint + oxfmt for linting/formatting (no eslint, no prettier).

**Monorepo layout**: `apps/{desktop,mcp}` + `packages/{core,db,tsconfig,oxlint}`. Bun workspaces with catalog: protocol for shared dep versions.

**Storage model**: flat `.md` files on disk are the source of truth. SQLite is a derived index for search/tags/backlinks, rebuilt from files when needed. Notes must remain portable.

**Product terminology**: user-facing language is `library`, `notebook`, and `note`.

- A **library** is the top-level curated note folder on disk.
- A **notebook** is a folder inside a library.
- A **note** is a plain `.md` file.
- Avoid user-facing `workspace` and `vault` copy. New code should use `library` unless referring to Bun workspace tooling.

**Library model**: a rune library is a curated note folder, created by the user or their agent. The primary UX is not "pick any folder like a code editor." It is:

1. Create library.
2. Choose a library name.
3. rune creates it under the platform default library root (`~/notes/rune` on Linux/macOS, `%USERPROFILE%\Documents\notes\rune` on Windows).
4. The user creates notebooks and notes inside that library.

The library folder is still just files on disk. Existing-folder opening can remain as an advanced/import path, but it is not the primary first-run experience.

**Library/filtering policy**: a library is deliberately curated for notes. We deliberately do **not** engineer filtering for arbitrary code repos: only `.md` files show, folders with no recursive `.md` content are hidden, and a tiny universal skip set (`.git`, `.rune`, `.DS_Store`, dotfiles) applies. No `.gitignore` parsing, no growing skip list.

**UI model**: three independent toggles, all bound to a user-configurable leader key.

- Sidebar (library tree, left), default `leader+b`, hidden by default
- Preview pane (rendered markdown, right), default `leader+p`, hidden by default
- Reading mode (preview full-window, hides editor), separate toggle

**Why this positioning**: local-first portable notes that an AI agent can edit as naturally as the user. The MCP-server-as-peer is the differentiator; without it, this is just another markdown editor.

**How to apply**:

- **Never use Next.js** or any web-app framework patterns (no app router, no server components, no SSR). This is a desktop app.
- **Do not lead with an arbitrary folder picker**. First-run and empty states should create a named library under the platform default library root.
- **Keep library files user-visible**. Use `~/notes/rune` on Linux/macOS and the OS Documents directory on Windows (`%USERPROFILE%\Documents\notes\rune`). Do not put note libraries in AppData.
- **Do not lock notes in a database**. Files on disk stay canonical; the index is rebuildable.
- **Do not put I/O in `packages/core`**. Pure logic only, so the MCP server can reuse it.
- **Do not engineer library tree filtering** beyond the universal skip set. The library is curated input. If `target/` shows up, the user is testing with a code repo, not using a real library.
- **Match conventions from `~/ops/t3code` and `~/ops/opencode`** (turbo + bun catalog) rather than inventing new ones.
- **Editor before MCP**, but both are first-class deliverables. Do not relegate either to "v2".
