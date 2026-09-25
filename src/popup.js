import { NANO_OPTIONS } from './ai.js';

const status = document.getElementById('status');
const model = document.getElementById('model');
const buttons = document.querySelectorAll('button');

function describe(r) {
  if (!r.ok) return r.error;
  const { closed, grouped, groups } = r.result;
  if (closed !== undefined) return `Closed ${closed} tabs`;
  if (!grouped) return 'Nothing to group';
  const how = r.result.method === 'site' ? ' by site' : '';
  return `Grouped ${grouped} tabs into ${groups} groups${how}`;
}

async function startModelDownload() {
  if (!globalThis.LanguageModel) return;
  const a = await LanguageModel.availability(NANO_OPTIONS);
  if (a !== 'downloadable' && a !== 'downloading') return;
  model.textContent = 'On-device AI downloading…';
  LanguageModel.create({
    ...NANO_OPTIONS,
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        model.textContent = `On-device AI downloading: ${Math.round(e.loaded * 100)}%`;
      });
    },
  }).then(
    (s) => {
      s.destroy();
      model.textContent = 'On-device AI ready — run again for topic grouping';
    },
    (e) => {
      model.textContent = `On-device AI unavailable: ${e.message}`;
    }
  );
}

for (const b of document.querySelectorAll('[data-action]')) {
  b.addEventListener('click', async () => {
    if (b.dataset.action !== 'clear-down') startModelDownload();
    for (const x of buttons) x.disabled = true;
    status.textContent = 'Working…';
    const r = await chrome.runtime.sendMessage({ action: b.dataset.action });
    status.textContent = describe(r);
    for (const x of buttons) x.disabled = false;
  });
}
