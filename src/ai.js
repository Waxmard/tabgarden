import { formatTabs, parseJsonLoose } from './logic.js';

export const NANO_OPTIONS = {
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

const GROUPS_SCHEMA = {
  type: 'object',
  properties: {
    groups: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          tabIds: { type: 'array', items: { type: 'integer' } },
        },
        required: ['name', 'tabIds'],
      },
    },
  },
  required: ['groups'],
};

function systemPrompt(existingNames) {
  return (
    'You group browser tabs by topic or task. Return only JSON: ' +
    '{"groups":[{"name":"1-3 word name","tabIds":[numbers]}]}. ' +
    `Existing group names: ${existingNames.join(', ') || 'none'}. ` +
    'Reuse one of these names exactly when a tab fits it. ' +
    'A new group needs at least 2 tabs. Leave out tabs that fit nowhere.'
  );
}

export async function nanoAvailability() {
  if (!globalThis.LanguageModel) return 'no-api';
  return await Promise.race([
    LanguageModel.availability(NANO_OPTIONS),
    new Promise((r) => setTimeout(r, 5000, 'timeout')),
  ]);
}

export async function proposeGroups(tabs, existingNames) {
  const availability = await nanoAvailability();
  if (availability !== 'available') {
    throw new Error(`On-device AI not ready: ${availability}`);
  }
  const session = await LanguageModel.create({
    ...NANO_OPTIONS,
    topK: 1,
    temperature: 1,
    initialPrompts: [{ role: 'system', content: systemPrompt(existingNames) }],
  });
  try {
    const text = await session.prompt(formatTabs(tabs), {
      responseConstraint: GROUPS_SCHEMA,
    });
    return parseJsonLoose(text).groups;
  } finally {
    session.destroy();
  }
}
