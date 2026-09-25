export const COLORS = [
  'blue',
  'red',
  'yellow',
  'green',
  'pink',
  'purple',
  'cyan',
  'orange',
  'grey',
];

export function tabsToClear(tabs, activeTab) {
  return tabs
    .filter((t) => t.index > activeTab.index && !t.pinned && t.groupId === -1)
    .map((t) => t.id);
}

function shortUrl(raw) {
  try {
    const u = new URL(raw);
    return u.hostname ? u.hostname + u.pathname : raw;
  } catch {
    return raw;
  }
}

export function formatTabs(tabs) {
  return tabs
    .map(
      (t) =>
        `${t.id} | ${(t.title || '').slice(0, 120)} | ${shortUrl(t.url || '')}`
    )
    .join('\n');
}

// ponytail: naive eTLD heuristic; use a public-suffix list if multi-part TLDs misgroup
export function siteName(hostname) {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  if (/^\d+(\.\d+){3}$/.test(host) || !host.includes('.')) return host;
  const labels = host.split('.');
  let i = labels.length - 2;
  if (
    labels.length > 2 &&
    labels.at(-1).length === 2 &&
    labels[i].length <= 3
  ) {
    i -= 1;
  }
  return labels[i];
}

export function groupBySite(tabs) {
  const buckets = new Map();
  for (const t of tabs) {
    let u;
    try {
      u = new URL(t.url);
    } catch {
      continue;
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') continue;
    const name = siteName(u.hostname);
    if (!buckets.has(name)) buckets.set(name, []);
    buckets.get(name).push(t.id);
  }
  return [...buckets].map(([name, tabIds]) => ({ name, tabIds }));
}

export function normalizeGroups(groups, validIds, existingNames) {
  if (!Array.isArray(groups)) return [];
  const existing = new Set(existingNames.map((n) => n.toLowerCase()));
  const byName = new Map();
  const taken = new Set();
  for (const g of groups) {
    const name = typeof g?.name === 'string' ? g.name.trim() : '';
    if (!name || !Array.isArray(g.tabIds)) continue;
    const key = name.toLowerCase();
    if (!byName.has(key)) byName.set(key, { name, tabIds: [] });
    for (const id of g.tabIds) {
      if (!validIds.has(id) || taken.has(id)) continue;
      taken.add(id);
      byName.get(key).tabIds.push(id);
    }
  }
  return [...byName.entries()]
    .filter(([key, g]) => g.tabIds.length >= (existing.has(key) ? 1 : 2))
    .map(([, g]) => g);
}

export function parseJsonLoose(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      throw new Error('AI response was not JSON');
    }
  }
}
