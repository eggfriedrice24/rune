# Changelog

## 0.1.3 - 2026-05-17

- Added incremental SQLite indexing for MCP and desktop search, including cleanup for deleted notes.
- Streamlined library actions with command-palette navigation and direct recent-library switching.
- Moved theme persistence to Tauri Store and added a configurable theme toggle keybinding.
- Prepared the MCP package to publish from bundled Bun output.
- Added a release validation script and documented the manual desktop, MCP, and AUR release flow.

## 0.1.2 - 2026-05-11

- Replaced the sidebar-centered desktop UI with a command-palette-first workflow and a compact app header.
- Added in-app dialogs for library, note, and notebook creation, plus recent library switching.
- Added command palette delete actions for notes and notebooks with confirmation.
- Added desktop live sync for external file changes from MCP or other local editors.
- Added SQLite-backed note search for MCP and the desktop command palette, including result cursor jumps.
- Added a keybindings popover and removed editor line numbers.
