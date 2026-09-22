import { formatTabs, parseJsonLoose } from './logic.js';

export const DEFAULT_BASE_URLS = {
  openai: 'https://api.openai.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
};

function systemPrompt(existingNames, categories) {
  let s =
    'You group browser tabs by topic or task. Return only JSON: ' +
    '{"groups":[{"name":"1-3 word name","tabIds":[numbers]}]}. ' +
    `Existing group names: ${existingNames.join(', ') || 'none'}. ` +
    'Reuse one of these names exactly when a tab fits it. ' +
    'A new group needs at least 2 tabs. Leave out tabs that fit nowhere.';
  const prefer = categories
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (prefer.length) {
    s += ` Prefer these group names when they fit: ${prefer.join(', ')}.`;
  }
  return s;
}

async function post(provider, url, headers, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${provider} ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

function isLocal(baseUrl) {
  const host = new URL(baseUrl).hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

export async function proposeGroups(settings, tabs, existingNames) {
  const { provider, baseUrl, apiKey, model, categories } = settings;
  if (!apiKey && !(provider === 'openai' && isLocal(baseUrl))) {
    throw new Error('Set an API key in tabgarden options');
  }
  const system = systemPrompt(existingNames, categories);
  const user = formatTabs(tabs);

  if (provider === 'gemini') {
    const data = await post(
      provider,
      `${baseUrl}/models/${model}:generateContent`,
      { 'x-goog-api-key': apiKey },
      {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0,
        },
      }
    );
    return parseJsonLoose(data.candidates[0].content.parts[0].text).groups;
  }

  const data = await post(
    provider,
    `${baseUrl}/chat/completions`,
    apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    {
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0,
    }
  );
  return parseJsonLoose(data.choices[0].message.content).groups;
}
