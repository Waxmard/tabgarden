import { nanoAvailability, proposeGroups } from './ai.js';
import {
  COLORS,
  describeResult,
  groupBySite,
  normalizeGroups,
  tabsToClear,
} from './logic.js';

let groupStatus = { state: 'idle', at: 0 };

function setGroupStatus(state, text = '') {
  groupStatus = { state, text, at: Date.now() };
  chrome.runtime
    .sendMessage({ type: 'group-status', ...groupStatus })
    .catch(() => {});
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

async function ungroupAll() {
  const ids = (await chrome.tabs.query({ currentWindow: true }))
    .filter((t) => t.groupId !== -1)
    .map((t) => t.id);
  if (ids.length) await chrome.tabs.ungroup(ids);
  return { ungrouped: ids.length };
}

async function autoGroup() {
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
  if ((await nanoAvailability()) === 'available') {
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

async function trackedGroup() {
  setGroupStatus('running');
  try {
    const result = await autoGroup();
    setGroupStatus('done', describeResult({ ok: true, result }));
    return result;
  } catch (e) {
    setGroupStatus('error', e.message);
    throw e;
  }
}

function run(action) {
  if (action === 'clear-down') return clearDown();
  if (action === 'group-ungrouped') return trackedGroup();
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
  if (msg.action === 'group-status') {
    reply(groupStatus);
    return;
  }
  run(msg.action).then(
    (result) => reply({ ok: true, result }),
    (e) => reply({ ok: false, error: e.message })
  );
  return true;
});
