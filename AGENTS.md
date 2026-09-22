# AGENTS.md

Guidance for AI agents working in this repo.

tabgarden is a personal Chrome extension (Manifest V3, plain JS, no bundler) that
AI-groups tabs in the current window and closes the loose tabs below the active tab.

## Commands
- `make ci` — biome check + `node --test` (what CI runs)
- `npm run check:fix` — apply biome fixes and formatting

## Layout
- `src/` — the unpacked extension root (load this directory, not the repo root)
  - `manifest.json` — permissions, commands (keyboard shortcuts), popup/options wiring
  - `background.js` — service worker: `clearDown`, `autoGroup`, command + message handlers
  - `logic.js` — pure selection/validation helpers; no `chrome.*`, unit-tested in Node
  - `ai.js` — OpenAI-compatible and Gemini adapters (`proposeGroups`)
  - `popup.*`, `options.*` — toolbar popup and settings page
- `test/` — `node:test` suites for `src/logic.js`

## Conventions
- Keep `chrome.*` calls out of `logic.js` so it stays testable without a browser.
- No build step and no dependencies at runtime; biome is the only dev tool.
- Settings live in `chrome.storage.local` (never `sync`) so API keys stay on one device.

## Reloading after edits
Open `chrome://extensions`, enable Developer mode, and click the reload icon on the
tabgarden card (first time: Load unpacked → pick `src/`). Service worker logs are under
"Inspect views: service worker". Shortcuts are remapped at `chrome://extensions/shortcuts`.
