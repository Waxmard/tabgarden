import { DEFAULT_BASE_URLS, proposeGroups } from './ai.js';
import { COLORS, normalizeGroups, tabsToClear } from './logic.js';

const DEFAULT_MODELS = { openai: 'gpt-4.1-mini', gemini: 'gemini-2.5-flash' };

async function getSettings() {
  const s = await chrome.storage.local.get({
    provider: 'openai',
    baseUrl: '',
    apiKey: '',
    model: '',
    categories: '',
  });
  s.baseUrl = (s.baseUrl || DEFAULT_BASE_URLS[s.provider]).replace(/\/$/, '');
  s.model ||= DEFAULT_MODELS[s.provider];
  return s;
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

async function autoGroup(mode) {
  const tabs = (await chrome.tabs.query({ currentWindow: true })).filter(
    (t) => !t.pinned
  );
  if (!tabs.length) return { grouped: 0, groups: 0 };
  const windowId = tabs[0].windowId;
  let existing = [];
  let candidates = tabs;
  if (mode !== 'all') {
    existing = await chrome.tabGroups.query({ windowId });
    candidates = tabs.filter((t) => t.groupId === -1);
  }
  const existingNames = existing.map((g) => g.title).filter(Boolean);
  if (!candidates.length) return { grouped: 0, groups: 0 };

  const raw = await proposeGroups(
    await getSettings(),
    candidates,
    existingNames
  );
  const groups = normalizeGroups(
    raw,
    new Set(candidates.map((t) => t.id)),
    existingNames
  );
  if (mode === 'all') {
    const grouped = candidates.filter((t) => t.groupId !== -1);
    if (grouped.length) await chrome.tabs.ungroup(grouped.map((t) => t.id));
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
  return { grouped: total, groups: groups.length };
}

function run(action) {
  if (action === 'clear-down') return clearDown();
  if (action === 'group-ungrouped') return autoGroup('ungrouped');
  if (action === 'regroup-all') return autoGroup('all');
  return Promise.reject(new Error(`Unknown action: ${action}`));
}

function badge(text, color, ms) {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), ms);
}

chrome.commands.onCommand.addListener((command) => {
  run(command).then(
    (r) => badge(String(r.closed ?? r.grouped), '#2e7d32', 2000),
    (e) => {
      console.error(e);
      badge('!', '#c62828', 4000);
    }
  );
});

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  run(msg.action).then(
    (result) => reply({ ok: true, result }),
    (e) => reply({ ok: false, error: e.message })
  );
  return true;
});
