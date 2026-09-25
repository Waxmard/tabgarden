# tabgarden

A Chrome extension that groups the tabs in your window by topic and closes the loose tabs after the one you're on.

Topic grouping runs on-device with Gemini Nano through Chrome's built-in Prompt API. When the model is unavailable, tabgarden groups tabs by site. It makes no network calls and stores nothing.

## Features

| Action | Shortcut | What it does |
|--------|----------|--------------|
| **Group ungrouped** | `Alt+Shift+G` | Sorts ungrouped tabs into named, colored groups. Tabs join your existing groups when they fit. A side panel shows progress and the result, then closes itself. |
| **Clear after** | `Alt+Shift+K` | Closes every loose tab after the active one. Pinned and grouped tabs stay open. |
| **Ungroup all** | none | Removes every group in the current window. |

All three actions are also in the toolbar popup. Change shortcuts at `chrome://extensions/shortcuts`.

## Requirements

- Chrome 138 or later.
- Optional: on-device Gemini Nano for topic grouping. See Chrome's [built-in AI hardware requirements](https://developer.chrome.com/docs/ai/get-started). Without it, tabs are grouped by site.

## Install

tabgarden isn't on the Chrome Web Store yet. Load it unpacked:

1. Clone this repository.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the `src/` directory, not the repository root.

The first time you click **Group ungrouped** in the popup, Chrome downloads the Gemini Nano model. The popup footer shows download progress.

## Development

The extension is plain JavaScript with no build step. Install the dev tools (Biome and Lefthook):

```sh
npm install
```

Run the same checks as CI (per-file line cap, Biome, and `node --test`):

```sh
make ci
```

After editing, click the reload icon on the tabgarden card in `chrome://extensions`. Service worker logs are under **Inspect views: service worker**.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the branch, commit, and release flow, and [AGENTS.md](AGENTS.md) for the source layout.

## License

[MIT](LICENSE)
