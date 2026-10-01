import { nanoAvailability, proposeGroups } from './ai.js';
import {
  COLORS,
  describeResult,
  groupBySite,
  normalizeGroups,
  smartClearIds,
  tabsToClear,
} from './logic.js';
import { usageSnapshot } from './usage.js';

let groupStatus = { state: 'idle', at: 0 };
const TABS = { permissions: ['tabs'] };
const NO_TABS =
  'This needs access to tab titles and URLs. Click "Group ungrouped" or "Smart clear" in the toolbar popup to allow it.';
const LEARNING =
  'Still learning which sites you use. Try Smart clear again after about an hour of browsing.';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let tabsDenied = false;

function setGroupStatus(state, text = '') {
  groupStatus = { state, text, at: Date.now() };
  chrome.runtime
    .sendMessage({ type: 'group-status', ...groupStatus })
    .catch(() => {});
}

// An idle extension service worker is stopped after 30s; each extension API call resets that timer.
async function waitUntil(done, ms) {
  const end = Date.now() + ms;
  while (!(await done())) {
    if (Date.now() > end) return false;
    await sleep(1000);
    await chrome.runtime.getPlatformInfo();
  }
  return true;
}

async function ensureTabs(interactive) {
  if (await chrome.permissions.contains(TABS)) return;
  if (interactive) {
    tabsDenied = false;
    setGroupStatus(
      'running',
      'Waiting for you to allow access to tab titles and URLs.'
    );
    await waitUntil(
      async () => tabsDenied || (await chrome.permissions.contains(TABS)),
      120_000
    );
    if (await chrome.permissions.contains(TABS)) return;
  }
  throw new Error(NO_TABS);
}

async function nanoReady(interactive) {
  const start = Date.now();
  let a = await nanoAvailability();
  if (interactive && (a === 'downloadable' || a === 'downloading')) {
    setGroupStatus(
      'running',
      'Downloading Gemini Nano, one time only. Grouping starts when it finishes.'
    );
    await waitUntil(async () => {
      a = await nanoAvailability();
      return !(
        a === 'downloading' ||
        (a === 'downloadable' && Date.now() - start < 15_000)
      );
    }, 20 * 60_000);
  }
  return a === 'available';
}

async function clearDown() {
  const [active] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const ids = tabsToClear(tabs, active);
  if (ids.length) await chrome.tabs.remove(ids);
  return { closed: ids.length };
}

async function smartClear() {
  await ensureTabs(false);
  const usage = await usageSnapshot();
  const [active] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const ids = smartClearIds(tabs, active, usage, Date.now());
  if (!ids) throw new Error(LEARNING);
  if (ids.length) await chrome.tabs.remove(ids);
  return { closed: ids.length };
}

async function ungroupAll() {
  const ids = (await chrome.tabs.query({ currentWindow: true }))
    .filter((t) => t.groupId !== -1)
    .map((t) => t.id);
  if (ids.length) await chrome.tabs.ungroup(ids);
  return { ungrouped: ids.length };
}

async function autoGroup(interactive) {
  await ensureTabs(interactive);
  const useAi = await nanoReady(interactive);
  const tabs = (await chrome.tabs.query({ currentWindow: true })).filter(
    (t) => !t.pinned
  );
  if (!tabs.length) return { grouped: 0, groups: 0 };
  const windowId = tabs[0].windowId;
  const existing = await chrome.tabGroups.query({ windowId });
  const candidates = tabs.filter((t) => t.groupId === -1);
  const existingNames = existing.map((g) => g.title).filter(Boolean);
  if (!candidates.length) return { grouped: 0, groups: 0 };

  const ids = new Set(candidates.map((t) => t.id));
  let method = 'ai';
  let groups = [];
  if (useAi) {
    setGroupStatus(
      'running',
      `Gemini Nano is sorting ${candidates.length} tabs on this device. This can take a few seconds.`
    );
    try {
      groups = normalizeGroups(
        await proposeGroups(candidates, existingNames),
        ids,
        existingNames
      );
    } catch (e) {
      console.warn('tabgarden: falling back to site grouping', e);
    }
  }
  if (!groups.length) {
    method = 'site';
    groups = normalizeGroups(groupBySite(candidates), ids, existingNames);
  }

  let total = 0;
  for (const [i, { name, tabIds }] of groups.entries()) {
    const match = existing.find(
      (g) => g.title?.toLowerCase() === name.toLowerCase()
    );
    if (match) {
      await chrome.tabs.group({ groupId: match.id, tabIds });
    } else {
      const gid = await chrome.tabs.group({
        tabIds,
        createProperties: { windowId },
      });
      await chrome.tabGroups.update(gid, {
        title: name,
        color: COLORS[i % COLORS.length],
        collapsed: false,
      });
    }
    total += tabIds.length;
  }
  return { grouped: total, groups: groups.length, method };
}

async function trackedGroup(interactive) {
  setGroupStatus('running');
  try {
    const result = await autoGroup(interactive);
    setGroupStatus('done', describeResult({ ok: true, result }));
    return result;
  } catch (e) {
    setGroupStatus('error', e.message);
    throw e;
  }
}

function run(action, interactive = false) {
  if (action === 'clear-down') return clearDown();
  if (action === 'smart-clear') return smartClear();
  if (action === 'group-ungrouped') return trackedGroup(interactive);
  if (action === 'ungroup-all') return ungroupAll();
  return Promise.reject(new Error(`Unknown action: ${action}`));
}

function badge(text, color, ms) {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
  if (ms) setTimeout(() => chrome.action.setBadgeText({ text: '' }), ms);
}

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'group-ungrouped') {
    chrome.sidePanel.open({ windowId: tab.windowId }).catch(console.warn);
  }
  badge('…', '#555555');
  run(command).then(
    (r) => badge(String(r.closed ?? r.ungrouped ?? r.grouped), '#2e7d32', 2000),
    (e) => {
      console.error(e);
      badge('!', '#c62828', 4000);
    }
  );
});

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.action === 'tabs-denied') {
    tabsDenied = true;
    return;
  }
  if (msg.action === 'group-status') {
    reply(groupStatus);
    return;
  }
  run(msg.action, msg.interactive === true).then(
    (result) => reply({ ok: true, result }),
    (e) => reply({ ok: false, error: e.message })
  );
  return true;
});
