# Chrome Web Store Listing — tabgarden

> Last Updated: 2026-09-25

## Store Listing

**Extension Name**
tabgarden

**Short Description**
Group the tabs in your window by topic in one keystroke, and close the loose tabs after the one you're on.

**Detailed Description**
tabgarden keeps the current window tidy: it sorts loose tabs into named, colored groups and clears out the tabs you've left behind.

Group ungrouped tabs by topic with one click or Alt+Shift+G. Tabs join your existing groups when they fit.
A side panel shows progress while grouping runs, then the result, and closes itself.
Close every loose tab after the active one with Alt+Shift+K. Pinned and grouped tabs are never closed.
Ungroup every tab in the window from the toolbar button.
Works the same with Chrome's horizontal tab strip and vertical tabs.

How to use it:
1. Open the tabs you want organized.
2. Press Alt+Shift+G (or click the toolbar button, then "Group ungrouped").
3. When you're done with the tabs after the current one, press Alt+Shift+K.
Shortcuts can be changed at chrome://extensions/shortcuts.

Privacy: everything happens on your device. Topic grouping uses Chrome's built-in on-device AI; if it isn't available, tabs are grouped by site. tabgarden sends nothing over the network and stores nothing.

**Category**
Productivity

**Single Purpose**
Organizes the tabs in the current window: groups them by topic and closes loose tabs after the active one.

**Primary Language**
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Created | src/icons/icon-128.png |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400 | ✅ Created | assets/store/screenshot-1.png |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | ✅ Created | assets/store/screenshot-2.png |
| Screenshot 3 [RECOMMENDED] | 1280×800 or 640×400 | ✅ Created | assets/store/screenshot-3.png |
| Screenshot 4 [RECOMMENDED] | 1280×800 or 640×400 | ✅ Created | assets/store/screenshot-4.png |
| Screenshot 5 [RECOMMENDED] | 1280×800 or 640×400 | ✅ Created | assets/store/screenshot-5.png |
| Small Promo Tile [RECOMMENDED] | 440×280 | ✅ Created | assets/store/promo-small.png |

### Screenshot Notes
1. Vertical tabs before and after grouping, with named, colored groups.
2. The horizontal tab strip before and after grouping.
3. A grouped window with the popup result and the side panel's "Done" state.
4. The toolbar popup after grouping, with its three actions.
5. The horizontal tab strip before and after Clear after (Alt+Shift+K) closes the loose tabs after the active one.

## Packaging

Run `make package` and upload `dist/tabgarden-v<version>.zip`.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| tabs | permissions | Reads tab titles and URLs in the current window so tabs can be grouped by topic or site, and closes tabs for "clear after". |
| tabGroups | permissions | Creates tab groups and sets their names and colors. |
| sidePanel | permissions | Shows grouping progress and the result in the side panel while "Group ungrouped" runs. |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

Tab titles and URLs are read in memory to decide groups, using on-device Gemini Nano or the site hostname. Nothing is transmitted off the device, and nothing is stored.

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [REQUIRED]
https://waxmard.github.io/tabgarden/privacy/

## Distribution

**Visibility**: Public
**Regions**: All regions

## Developer Info

**Publisher Name** [REQUIRED]
Maxwell Ward

**Contact Email** [REQUIRED]
maxward4@gmail.com

**Support URL / Email**
https://github.com/Waxmard/tabgarden/issues

**Homepage URL**
https://github.com/Waxmard/tabgarden

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 0.2.0 | 2026-09-25 | Side panel shows grouping progress and result | Draft |

## Review Notes

### Known Issues / Limitations
- Topic grouping needs Chrome's on-device AI (Gemini Nano); without it, tabs are grouped by site.
- The on-device model downloads once on first use from the toolbar popup.

### Rejection History
None.
