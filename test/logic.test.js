import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeGroups, parseJsonLoose, tabsToClear } from '../src/logic.js';

const tabs = [0, 1, 2, 3, 4, 5].map((i) => ({
  id: 100 + i,
  index: i,
  pinned: i === 1,
  groupId: i === 4 ? 7 : -1,
}));

test('tabsToClear skips pinned and grouped tabs from the active tab down', () => {
  assert.deepEqual(tabsToClear(tabs, tabs[2]), [102, 103, 105]);
});

test('tabsToClear skips a grouped active tab but clears loose tabs below', () => {
  assert.deepEqual(tabsToClear(tabs, tabs[4]), [105]);
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
