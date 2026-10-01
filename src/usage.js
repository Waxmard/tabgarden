import { addUsage, dayKey, hostOf } from './logic.js';

// ponytail: segment capped at 1h to bound sleep-without-lock gaps; use chrome.alarms heartbeats if long focus is undercounted
const MAX_SEGMENT_S = 3600;
let queue = Promise.resolve();
const serial = (fn) => {
  queue = queue.then(fn).catch(console.warn);
  return queue;
};

async function focusHost(host) {
  const { focus } = await chrome.storage.session.get('focus');
  if (focus) {
    const secs = Math.min((Date.now() - focus.since) / 1000, MAX_SEGMENT_S);
    if (secs >= 1) {
      const { usage } = await chrome.storage.local.get('usage');
      await chrome.storage.local.set({
        usage: addUsage(usage, focus.host, secs, dayKey(Date.now())),
      });
    }
  }
  await chrome.storage.session.set({
    focus: host ? { host, since: Date.now() } : null,
  });
}

async function refocus() {
  const w = await chrome.windows
    .getLastFocused({ populate: true })
    .catch(() => null);
  const tab = w?.focused ? w.tabs.find((t) => t.active) : undefined;
  await focusHost(tab ? hostOf(tab.url) : null);
}

chrome.idle.setDetectionInterval(300);
chrome.tabs.onActivated.addListener(() => serial(refocus));
chrome.tabs.onUpdated.addListener((_id, info, tab) => {
  if (info.url && tab.active) serial(refocus);
});
chrome.windows.onFocusChanged.addListener(() => serial(refocus));
chrome.idle.onStateChanged.addListener((s) =>
  serial(s === 'active' ? refocus : () => focusHost(null))
);

export async function usageSnapshot() {
  await serial(refocus);
  return (await chrome.storage.local.get('usage')).usage;
}
