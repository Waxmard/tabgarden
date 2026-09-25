import { NANO_OPTIONS, nanoAvailability } from './ai.js';

const status = document.getElementById('status');
const model = document.getElementById('model');
const download = document.getElementById('download');
const buttons = document.querySelectorAll('button');

function describe(r) {
  if (!r.ok) return r.error;
  const { closed, grouped, groups } = r.result;
  if (closed !== undefined) return `Closed ${closed} tabs`;
  if (!grouped) return 'Nothing to group';
  const how = r.result.method === 'site' ? ' by site' : '';
  return `Grouped ${grouped} tabs into ${groups} groups${how}`;
}

const MODEL_STATES = {
  available: 'On-device AI ready',
  downloadable: 'On-device AI not downloaded — grouping by site',
  downloading: 'On-device AI downloading…',
  unavailable: 'On-device AI not supported on this device — grouping by site',
  'no-api': 'On-device AI unavailable in this Chrome — grouping by site',
};

async function showModelState() {
  const a = await nanoAvailability();
  model.textContent =
    MODEL_STATES[a] ?? 'On-device AI not responding — grouping by site';
  download.hidden = a !== 'downloadable' && a !== 'downloading';
}

showModelState();

download.addEventListener('click', () => {
  download.hidden = true;
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
      model.textContent = 'On-device AI ready';
    },
    (e) => {
      model.textContent = `On-device AI unavailable: ${e.message}`;
      download.hidden = false;
    }
  );
});

for (const b of document.querySelectorAll('[data-action]')) {
  b.addEventListener('click', async () => {
    for (const x of buttons) x.disabled = true;
    status.textContent = 'Working…';
    const r = await chrome.runtime.sendMessage({ action: b.dataset.action });
    status.textContent = describe(r);
    for (const x of buttons) x.disabled = false;
  });
}
