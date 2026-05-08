---
name: catalog-first when adding new deps to workspaces
description: When adding any dependency to a workspace in this monorepo, default to promoting it through the root workspaces.catalog
type: feedback
originSessionId: 630c3ac1-31e6-4b00-942d-a2624ea063e0
---

When adding a new dependency to any workspace in this monorepo (rune), **default to the catalog flow** - even if the dep is currently only consumed by one workspace.

The flow:

1. `bun add <pkg>` (or `-D`) inside the target workspace to get bun to resolve the actual version.
2. Read the resolved version from the workspace's `package.json`.
3. Move that entry into the root `package.json`'s `workspaces.catalog`.
4. Change the workspace entry to `"<pkg>": "catalog:"`.
5. `bun install` from root to re-resolve through the catalog.

**Why**: future workspaces that pull in the same dep automatically get the same pinned version - no drift, no per-workspace bumping. The cost of an extra catalog entry is one line in root `package.json`. The cost of NOT cataloging is silent version skew when a second workspace adopts the dep later.

**How to apply**:

- Skip catalog only for deps that are inherently single-workspace AND single-instance (e.g. `@tauri-apps/cli` since only the desktop app shells out to Tauri). Even then, when in doubt, catalog.
- If a dep ever moves into the catalog after being added directly, do it as a deliberate "promote to catalog" pass - don't let workspaces accumulate raw versions silently.
- Combine with the no-hand-written-versions rule: always run `bun add` first to get the resolved version, then promote that resolved string into the catalog. Never type a version blindly.
