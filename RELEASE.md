# Release Process

This release flow keeps publishing explicit while rune is early. GitHub builds desktop releases, the AUR package is automated from a separate packaging repo, and MCP publishing stays manual until it is ready.

## Preflight

Run the full local release check from the repo root:

```bash
bun release:check
```

That runs formatting, linting, typechecking, tests, the workspace build, a no-bundle Tauri desktop build, and an MCP package dry-run.

If you need to run the slower checks separately:

```bash
bun tauri:build:no-bundle
bun mcp:pack:check
```

## Version Updates

Before tagging a release, update every shipped version intentionally:

- Root `CHANGELOG.md`
- `apps/desktop/package.json`
- `apps/desktop/src-tauri/tauri.conf.json`
- `apps/desktop/src-tauri/Cargo.toml`
- `apps/mcp/package.json` when publishing an MCP release

Do not hand-write dependency versions. Use package manager commands for dependencies.

## Desktop Release

Desktop release assets are built by `.github/workflows/release.yml` when a `v*` tag is pushed.

Manual flow:

```bash
git tag v0.1.4
git push origin main --tags
```

After the workflow finishes:

- Open the draft GitHub release.
- Confirm Linux `.deb`, `.rpm`, `.AppImage`, macOS, and Windows assets are present.
- Update release notes from `CHANGELOG.md`.
- Publish the GitHub release.
- Confirm the `Dispatch AUR Update` workflow either dispatches `eggfriedrice24/rune-notes-bin` or skips because `AUR_REPO_DISPATCH_TOKEN` is not configured.

## MCP Package

The MCP package publishes the bundled Bun output at `apps/mcp/dist/index.js`. The source files are not part of the npm package.

Before publishing:

```bash
bun --cwd apps/mcp pm pack --dry-run
```

Confirm the package contains only:

- `package.json`
- `README.md`
- `dist/index.js`

Confirm the packed CLI runs:

```bash
bun --cwd apps/mcp pm pack --destination /tmp/opencode
bunx --bun --package file:/tmp/opencode/rune-mcp-0.0.1.tgz rune-mcp --help
```

Publish from `apps/mcp` only after the dry-run output looks correct.

## AUR Package

The Arch package is managed from `eggfriedrice24/rune-notes-bin`, with local checkout `~/p/rune-notes-bin`.

The packaging repo:

- Tracks published `eggfriedrice24/rune` releases.
- Builds `rune-notes-bin` from the Linux `.deb` release asset.
- Pushes `PKGBUILD` and `.SRCINFO` to `ssh://aur@aur.archlinux.org/rune-notes-bin.git`.
- Polls every 6 hours as a fallback.
- Accepts `repository_dispatch` event `rune-release-published` for immediate updates.

The main repo sends that dispatch from `.github/workflows/aur-dispatch.yml` when a non-prerelease GitHub release is published.

Required main-repo secret for immediate AUR updates:

```txt
AUR_REPO_DISPATCH_TOKEN
```

Use a fine-grained GitHub token that can call `repository_dispatch` on `eggfriedrice24/rune-notes-bin`. If the secret is missing, the dispatch workflow skips and the 6-hour packaging poll remains the fallback.

Required packaging-repo secret for pushing to AUR:

```txt
AUR_SSH_PRIVATE_KEY
```

Manual packaging repo check:

```bash
cd ~/p/rune-notes-bin
bash scripts/check_upstream.sh
makepkg -f
```

Manual forced packaging workflow:

```bash
gh workflow run publish-aur.yml --repo eggfriedrice24/rune-notes-bin -f force_publish=true
```

## Automation Later

Good next automation targets:

- A release validation workflow that runs `bun release:check` or its CI-safe subset.
- A guarded MCP publish workflow with npm provenance.
- A post-release verification script that checks GitHub release assets and AUR package version.
