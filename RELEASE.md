# Release Process

This release flow is intentionally manual while rune is early. Keep publishing steps boring and explicit until the desktop, MCP, and AUR paths have settled.

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
git tag v0.1.3
git push origin main --tags
```

After the workflow finishes:

- Open the draft GitHub release.
- Confirm Linux `.deb`, `.rpm`, `.AppImage`, macOS, and Windows assets are present.
- Update release notes from `CHANGELOG.md`.
- Publish the GitHub release.

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

The Arch package is currently manual in the local AUR checkout at `~/p/rune-notes-bin` and publishes to `ssh://aur@aur.archlinux.org/rune-notes-bin.git`.

Manual flow after publishing the GitHub desktop release:

```bash
cd ~/p/rune-notes-bin
```

Update `PKGBUILD`:

- Set `pkgver` to the desktop version without the leading `v`.
- Reset or increment `pkgrel` as appropriate.
- Point `source` at the new GitHub release `.deb`.
- Update `sha256sums` from the new asset.

Regenerate and test package metadata:

```bash
makepkg --printsrcinfo > .SRCINFO
makepkg -f
```

Commit and push to AUR:

```bash
git add PKGBUILD .SRCINFO
git commit -m "update to 0.1.3"
git push
```

Do not commit local `makepkg` artifacts such as `pkg/`, `src/`, `.deb`, or `.pkg.tar.zst` files.

## Automation Later

Automate only after this manual path is stable for a few releases. Good first automation targets:

- A release validation workflow that runs `bun release:check` or its CI-safe subset.
- A script that prepares the AUR `PKGBUILD` and `.SRCINFO` from a GitHub release asset.
- A guarded MCP publish workflow with npm provenance.
