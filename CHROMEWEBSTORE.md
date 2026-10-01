# Chrome Web Store Listing — tabgarden

> Last Updated: 2026-09-30

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
Smart clear (Alt+Shift+J) keeps the tabs for sites you use every day, closes the other loose tabs in the window, and never closes a tab you focused in the last 30 minutes. It learns your everyday sites from how long you spend on each one, on your device.
Ungroup every tab in the window with Alt+Shift+U or the toolbar button.
Works the same with Chrome's horizontal tab strip and vertical tabs.

How to use it:
1. Open the tabs you want organized.
2. Press Alt+Shift+G (or click the toolbar button, then "Group ungrouped").
3. When you're done with the tabs after the current one, press Alt+Shift+K.
4. To close stray tabs but keep your everyday sites, press Alt+Shift+J. Smart clear starts working after about an hour of browsing.
5. To remove every group in the window, press Alt+Shift+U.
Shortcuts can be changed at chrome://extensions/shortcuts.

Privacy: everything happens on your device. Topic grouping uses Chrome's built-in on-device AI; if it isn't available, tabs are grouped by site. For Smart clear, tabgarden stores how many seconds per day you focus each site (hostname only), for up to 60 days, in local extension storage. That data never syncs and is never transmitted. tabgarden sends nothing over the network.

About the "Read your browsing history" prompt: Chrome uses that wording for any extension that can see tab titles and URLs. tabgarden asks for it the first time you group tabs or use Smart clear, and only reads the titles and URLs of the tabs in your current window, on your device. It never reads your history list. Clear after and Ungroup all work without it.

**Category**
Productivity

**Single Purpose**
Organizes the tabs in the current window: groups them by topic, closes loose tabs after the active one, and closes loose tabs from sites you rarely use.

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
| tabs | optional_permissions | Requested the first time the user clicks "Group ungrouped" or "Smart clear". Reads tab titles and URLs in the current window so tabs can be grouped by topic or site, and so Smart clear can see each tab's site and time focused on it. Closing after the active tab and ungrouping work without it. |
| tabGroups | permissions | Creates tab groups and sets their names and colors. |
| sidePanel | permissions | Shows grouping progress and the result in the side panel while "Group ungrouped" runs. |
| storage | permissions | Saves per-site focus time on this device for Smart clear. |
| idle | permissions | Pauses focus timing while you're away. |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

Tab titles and URLs are read in memory to decide groups, using on-device Gemini Nano or the site hostname. For Smart clear, tabgarden stores focused seconds per day for each site hostname, for up to 60 days, in local extension storage (`chrome.storage.local`). Nothing is synced or transmitted off the device.

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
