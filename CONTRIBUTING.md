# Contributing to rune

Thanks for helping make rune better. The project is early, so focused issues and small pull requests are the easiest to review.

## Product Boundaries

- rune is a local-first markdown note-taking app, not a generic code editor.
- Notes stay as plain `.md` files on disk. SQLite is only a derived index.
- Use the product terms library, notebook, and note in user-facing code and docs.
- Do not add accounts, cloud sync, telemetry, or required internet access.
- Do not add Next.js, server components, SSR, or a web-app framework.
- Keep `packages/core` free of filesystem, Tauri, Bun-only, and network I/O.
- The MCP server is local IPC and must not make network calls itself.

## Development Setup

Install Bun and the platform dependencies required by Tauri 2, then run:

```bash
bun install
bun tauri:dev
```

The desktop app lives in `apps/desktop`. The MCP server lives in `apps/mcp`.

## Required Checks

Run these from the repo root before opening a pull request:

```bash
bun fmt
bun lint
bun typecheck
bun test
```

If you touch desktop release or Tauri behavior, also run a relevant desktop build or smoke test.

For release preparation, follow `RELEASE.md` and run:

```bash
bun release:check
```

## Code Style

- Prefer small, direct changes over broad rewrites.
- Avoid `any`; use precise types or `unknown` at boundaries.
- Prefer inferred types unless an exported API needs a clear annotation.
- Prefer functional array methods and early returns.
- Avoid unnecessary comments. Add comments only for hidden constraints or non-obvious decisions.
- Keep user-facing copy clear and specific to note-taking.

## Dependencies

Use the package manager to resolve versions. Do not hand-write dependency versions into `package.json`.

For shared workspace dependencies, add the package through Bun and promote the resolved version into the root `workspaces.catalog`, then reference it from workspaces as `catalog:`.

## Tests

Prefer tests that exercise the real implementation. Avoid mocks when a temp directory or real file operation is practical.

Tests should live next to the code they cover or in a package-local `test` directory.

## Pull Requests

- Explain the user-facing change and why it is needed.
- Keep unrelated changes out of the same pull request.
- Include screenshots or recordings for visible desktop UI changes.
- Note which checks you ran.
- Do not commit secrets, personal notes, private library contents, or generated release artifacts.

## Security

Do not publish vulnerability details in a public issue. Use GitHub private vulnerability reporting if it is available. If it is not available, open a minimal issue asking for a private reporting path without including exploit details.
