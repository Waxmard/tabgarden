import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  addUsage,
  dayKey,
  describeResult,
  groupBySite,
  keepHosts,
  normalizeGroups,
  parseJsonLoose,
  scoreHosts,
  smartClearIds,
  tabsToClear,
} from '../src/logic.js';

const tabs = [0, 1, 2, 3, 4, 5].map((i) => ({
  id: 100 + i,
  index: i,
  pinned: i === 1,
  groupId: i === 4 ? 7 : -1,
}));

test('tabsToClear keeps the active tab and skips pinned and grouped tabs below', () => {
  assert.deepEqual(tabsToClear(tabs, tabs[2]), [103, 105]);
});

test('normalizeGroups filters, dedupes, merges, and enforces sizes', () => {
  const out = normalizeGroups(
    [
      { name: ' News ', tabIds: [1, 2, 99] },
      { name: 'news', tabIds: [3, 1] },
      { name: 'Solo', tabIds: [4] },
      { name: 'Docs', tabIds: [5] },
      { name: '', tabIds: [6, 7] },
    ],
    new Set([1, 2, 3, 4, 5, 6, 7]),
    ['docs']
  );
  assert.deepEqual(out, [
    { name: 'News', tabIds: [1, 2, 3] },
    { name: 'Docs', tabIds: [5] },
  ]);
  assert.deepEqual(normalizeGroups(null, new Set(), []), []);
});

test('parseJsonLoose strips code fences and rejects non-JSON', () => {
  assert.deepEqual(parseJsonLoose('```json\n{"groups":[]}\n```'), {
    groups: [],
  });
  assert.throws(() => parseJsonLoose('nope'), /AI response was not JSON/);
});

test('groupBySite buckets http(s) tabs by registrable name and skips others', () => {
  const urls = [
    'https://github.com/a',
    'https://docs.github.com/b',
    'https://www.bbc.co.uk/x',
    'https://bbc.co.uk/y',
    'chrome://newtab/',
    'https://example.org/',
  ];
  assert.deepEqual(groupBySite(urls.map((url, i) => ({ id: i + 1, url }))), [
    { name: 'github', tabIds: [1, 2] },
    { name: 'bbc', tabIds: [3, 4] },
    { name: 'example', tabIds: [6] },
  ]);
});

test('describeResult pluralizes counts', () => {
  const d = (result) => describeResult({ ok: true, result });
  assert.equal(d({ grouped: 4, groups: 1 }), 'Grouped 4 tabs into 1 group');
  assert.equal(
    d({ grouped: 1, groups: 2, method: 'site' }),
    'Grouped 1 tab into 2 groups by site'
  );
  assert.equal(d({ closed: 1 }), 'Closed 1 tab');
});

const DAY = 86_400_000;
const NOW = new Date(2025, 5, 20, 12).getTime();
const ago = (n) => dayKey(NOW - n * DAY);

test('keepHosts cuts at the steepest drop and drops noise below the floor', () => {
  const scores = new Map([
    ['gemini.google.com', 6.4],
    ['mail.google.com', 6.2],
    ['maps.google.com', 5.9],
    ['github.com', 2.77],
    ['amazon.com', 0.3],
  ]);
  assert.deepEqual(
    keepHosts(scores),
    new Set(['gemini.google.com', 'mail.google.com', 'maps.google.com'])
  );
  const flat = new Map([
    ['a', 5],
    ['b', 4],
    ['c', 3.5],
  ]);
  assert.deepEqual(keepHosts(flat), new Set(['a', 'b', 'c']));
});

test('scoreHosts favors a daily habit over a one-day binge', () => {
  const daily = {};
  for (let i = 0; i < 14; i++) daily[ago(i)] = 600;
  const usage = {
    since: ago(13),
    sites: { daily: daily, binge: { [ago(0)]: 18000 } },
  };
  const s = scoreHosts(usage, ['daily', 'binge'], ago(0));
  assert.ok(Math.abs(s.get('daily') - 4.39) < 0.05, s.get('daily'));
  assert.ok(Math.abs(s.get('binge') - 0.72) < 0.05, s.get('binge'));
});

test('addUsage prunes days 60+ old and hosts left empty', () => {
  const usage = {
    since: ago(70),
    sites: { old: { [ago(60)]: 50 }, keep: { [ago(59)]: 50 } },
  };
  addUsage(usage, 'new', 10, ago(0));
  assert.deepEqual(usage.sites, {
    keep: { [ago(59)]: 50 },
    new: { [ago(0)]: 10 },
  });
});

test('smartClearIds waits to learn, then closes only stale tabs of unscored sites', () => {
  const stale = NOW - 2 * 3_600_000;
  const t = (id, url, extra = {}) => ({
    id,
    url,
    pinned: false,
    groupId: -1,
    lastAccessed: stale,
    ...extra,
  });
  const open = [
    t(1, 'https://active.example/'),
    t(2, 'https://pinned.example/', { pinned: true }),
    t(3, 'https://grouped.example/', { groupId: 4 }),
    t(4, 'https://recent.example/', { lastAccessed: NOW - 5 * 60_000 }),
    t(5, 'https://mail.google.com/a'),
    t(6, 'https://www.mail.google.com/b'),
    t(7, 'https://news.example/'),
    t(8, 'chrome://newtab/'),
  ];
  const mail = {};
  for (let i = 0; i < 14; i++) mail[ago(i)] = 600;
  const usage = { since: ago(13), sites: { 'mail.google.com': mail } };
  assert.equal(
    smartClearIds(
      open,
      open[0],
      { since: ago(0), sites: { x: { [ago(0)]: 3599 } } },
      NOW
    ),
    null
  );
  assert.equal(smartClearIds(open, open[0], undefined, NOW), null);
  assert.deepEqual(smartClearIds(open, open[0], usage, NOW), [7, 8]);
});
