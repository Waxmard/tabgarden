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

const count = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function describeResult(r) {
  if (!r.ok) return r.error;
  const { closed, ungrouped, grouped, groups } = r.result;
  if (closed !== undefined) return `Closed ${count(closed, 'tab')}`;
  if (ungrouped !== undefined) return `Ungrouped ${count(ungrouped, 'tab')}`;
  if (!grouped) return 'Nothing to group';
  const how = r.result.method === 'site' ? ' by site' : '';
  return `Grouped ${count(grouped, 'tab')} into ${count(groups, 'group')}${how}`;
}

const DAY_MS = 86_400_000;
const HALF_LIFE_DAYS = 7;
const PRUNE_DAYS = 60;
const ACTIVE_DAY_S = 120;
const LEARN_MIN_S = 3600;
const RECENT_MS = 30 * 60_000;
const FLOOR = 0.1;
const BREAK = 0.6;

export function hostOf(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function dayKey(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const daysBetween = (a, b) =>
  Math.round((Date.parse(b) - Date.parse(a)) / DAY_MS);

export function addUsage(usage, host, seconds, today) {
  const u = usage ?? { since: today, sites: {} };
  u.sites[host] ??= {};
  u.sites[host][today] = (u.sites[host][today] ?? 0) + seconds;
  for (const [h, ds] of Object.entries(u.sites)) {
    for (const day of Object.keys(ds)) {
      if (daysBetween(day, today) >= PRUNE_DAYS) delete ds[day];
    }
    if (!Object.keys(ds).length) delete u.sites[h];
  }
  return u;
}

export function scoreHosts(usage, hosts, today) {
  const w = (day) => 0.5 ** (daysBetween(day, today) / HALF_LIFE_DAYS);
  const tracked = Math.min(PRUNE_DAYS, daysBetween(usage.since, today) + 1);
  let denom = 0;
  for (let a = 0; a < tracked; a++) denom += 0.5 ** (a / HALF_LIFE_DAYS);
  const scores = new Map();
  for (const host of hosts) {
    let habit = 0;
    let minutes = 0;
    for (const [day, secs] of Object.entries(usage.sites[host] ?? {})) {
      if (secs >= ACTIVE_DAY_S) habit += w(day);
      minutes += (secs / 60) * w(day);
    }
    scores.set(host, (habit / denom) * Math.log1p(minutes));
  }
  return scores;
}

// ponytail: fixed FLOOR/BREAK constants; expose tuning only if real usage shows bad cuts
export function keepHosts(scores) {
  const ranked = [...scores]
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return new Set();
  const live = ranked.filter(([, s]) => s >= ranked[0][1] * FLOOR);
  let cut = live.length;
  let best = BREAK;
  for (let i = 0; i < live.length - 1; i++) {
    const r = live[i + 1][1] / live[i][1];
    if (r <= best) {
      best = r;
      cut = i + 1;
    }
  }
  return new Set(live.slice(0, cut).map(([h]) => h));
}

export function smartClearIds(tabs, activeTab, usage, now) {
  const total = Object.values(usage?.sites ?? {})
    .flatMap(Object.values)
    .reduce((a, b) => a + b, 0);
  if (total < LEARN_MIN_S) return null;
  const candidates = tabs.filter(
    (t) => t.id !== activeTab.id && !t.pinned && t.groupId === -1
  );
  const hosts = new Set(candidates.map((t) => hostOf(t.url)).filter(Boolean));
  const keep = keepHosts(scoreHosts(usage, hosts, dayKey(now)));
  return candidates
    .filter(
      (t) =>
        !(t.lastAccessed && now - t.lastAccessed < RECENT_MS) &&
        !keep.has(hostOf(t.url))
    )
    .map((t) => t.id);
}
