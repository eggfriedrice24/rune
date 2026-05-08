---
name: never expose email in published metadata
description: For published packages and public repo files, identify the user by GitHub username only - never include their email
type: feedback
originSessionId: 630c3ac1-31e6-4b00-942d-a2624ea063e0
---

When writing public-facing project metadata (`package.json` `author`, `LICENSE` copyright line, `Cargo.toml` `authors`, `pyproject.toml` `authors`, public README badges, etc.), **identify the user by their GitHub username only**, not their email.

Specifically: do not put `dev@fluxx.gg`, `eggfriedricew.g.o@gmail.com`, or any other email into any file that will be published, pushed, or shipped. Use the form `"eggfriedrice (https://github.com/eggfriedrice)"` or just `"eggfriedrice"`.

**Why**: published package registries (npm, crates.io) cache forever. Once an email is in a published version, it's harvested by spammers and indexers and cannot be retroactively scrubbed.

**How to apply**:

- `package.json` `author`: name + GitHub URL, no `email` field.
- `LICENSE` copyright line: `Copyright (c) <year> eggfriedrice` - no email.
- Git commit author email is fine to keep as configured (that's local to commits, not published metadata) - only worry about files that ship in releases or in public repo content.
- If a tool _requires_ a contact, prefer creating an issue tracker URL or `https://github.com/<user>/<repo>/issues` instead of an email.
