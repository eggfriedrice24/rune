---
name: never hand-write package versions
description: Always use bun add / package manager commands to resolve and pin versions, never type version numbers into package.json by hand
type: feedback
originSessionId: 630c3ac1-31e6-4b00-942d-a2624ea063e0
---

When setting up `package.json` files (root or workspace), **never type dependency version numbers by hand**. Always run `bun add` / `bun add -D` (or the equivalent for the tool: `cargo add`, etc.) so the package manager resolves the latest compatible version and writes it back.

For bun catalog entries, use `bun add --catalog <pkg>` to put a shared dep in the root `workspaces.catalog`. To consume in a workspace, run `bun add <pkg>` inside that workspace and it picks up `catalog:`.

**Why**: hand-written versions go stale fast, drift across packages, and waste time guessing what the current latest is. The package manager already knows. Writing the wrong version causes install failures or silent drift.

**How to apply**:

- Scaffold `package.json` with just structure (`name`, `private`, `workspaces`, `scripts`) and an empty or near-empty `dependencies`/`devDependencies`.
- Add deps with `bun add` / `bun add -D` / `bun add --catalog`.
- The same applies to other ecosystems (Cargo deps via `cargo add`, etc.).
- Exception: when copying a known-good config from a reference repo and not changing it, keeping its versions verbatim is fine.
