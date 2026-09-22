import { DEFAULT_BASE_URLS } from './ai.js';

const FIELDS = ['provider', 'baseUrl', 'apiKey', 'model', 'categories'];
const MODEL_HINTS = { openai: 'gpt-4.1-mini', gemini: 'gemini-2.5-flash' };
const el = Object.fromEntries(
  FIELDS.map((f) => [f, document.getElementById(f)])
);

function updatePlaceholders() {
  el.baseUrl.placeholder = DEFAULT_BASE_URLS[el.provider.value];
  el.model.placeholder = MODEL_HINTS[el.provider.value];
}

const stored = await chrome.storage.local.get({
  provider: 'openai',
  baseUrl: '',
  apiKey: '',
  model: '',
  categories: '',
});
for (const f of FIELDS) el[f].value = stored[f];
updatePlaceholders();
el.provider.addEventListener('change', updatePlaceholders);

document.getElementById('save').addEventListener('click', async () => {
  await chrome.storage.local.set(
    Object.fromEntries(FIELDS.map((f) => [f, el[f].value.trim()]))
  );
  const saved = document.getElementById('saved');
  saved.textContent = 'Saved';
  setTimeout(() => {
    saved.textContent = '';
  }, 1500);
});
