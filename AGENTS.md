# AGENTS.md

Guidance for AI agents working in this repo.

tabgarden is a personal Chrome extension (Manifest V3, plain JS, no bundler) that
AI-groups tabs in the current window and closes the loose tabs after the active tab.

## Commands
- `make ci` — 250-line per-file cap (`scripts/check-line-limit.sh`) + biome check + `node --test` (what CI runs)
- `npm run check:fix` — apply biome fixes and formatting
- `make icons` — regenerate `src/icons/*.png` from `assets/icon.svg` (needs Chrome and ImageMagick)
- `make package` — zip `src/` into `dist/tabgarden-v<version>.zip` for Chrome Web Store upload

## Layout
- `src/` — the unpacked extension root (load this directory, not the repo root)
  - `manifest.json` — permissions, commands (keyboard shortcuts), popup wiring
  - `background.js` — service worker: `clearDown`, `autoGroup`, command + message handlers
  - `logic.js` — pure selection/validation helpers; no `chrome.*`, unit-tested in Node
  - `ai.js` — on-device Gemini Nano via Chrome's Prompt API (`proposeGroups`); `background.js` falls back to `groupBySite` when Nano is unavailable or returns nothing
  - `popup.*` — toolbar popup; a click also starts the one-time Nano model download
  - `panel.*` — side panel that opens while "Group ungrouped" runs; shows progress, then the result, then closes itself
  - `theme.css` — shared styles for the popup and side panel
- `test/` — `node:test` suites for `src/logic.js`
- `assets/icon.svg` — logo source; the PNGs in `src/icons/` are generated from it
- `assets/store/` — store screenshots
- `docs/privacy.md` — privacy policy served on GitHub Pages

## Conventions
- Keep `chrome.*` calls out of `logic.js` so it stays testable without a browser.
- No build step and no dependencies at runtime; biome is the only dev tool.
- No settings, keys, or network calls: grouping runs on-device (Nano) or by site.
- Whenever you create or change anything in the extension, create and maintain `CHROMEWEBSTORE.md` (store listing, single purpose, a justification for each manifest permission, privacy notes). Use the `chrome-extensions` skill for its format.

## Branching & releases
- Branch off `dev` (the default branch) and open PRs against `dev`; PRs are squash-merged. `main` is release-only.
- Conventional Commit subjects are required: release-please derives the version and changelog from them.
- To ship, open a `dev → main` PR and rebase-merge it. release-please then opens a release PR on `main` that bumps `src/manifest.json` and auto-merges once CI passes; the merge tags the version.
- After a release, reset `dev` to `main` (`git switch dev && git reset --hard origin/main && git push -f`) so the rebased commits don't reappear in the next promotion.
- Upload to the Chrome Web Store by hand: `make package` on the tagged `main`, then upload `dist/tabgarden-v<version>.zip`.
- The `main` ruleset (required `check`, linear history, no force-push) targets `refs/heads/main`, not `~DEFAULT_BRANCH`; otherwise it follows the default to `dev` and blocks the post-release reset.
- Biome formats JSON with `expand: always` so it matches release-please's rewrite of `src/manifest.json`; don't collapse it.

## Reloading after edits
Open `chrome://extensions`, enable Developer mode, and click the reload icon on the
tabgarden card (first time: Load unpacked → pick `src/`). Service worker logs are under
"Inspect views: service worker". Shortcuts are remapped at `chrome://extensions/shortcuts`.
