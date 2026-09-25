import { NANO_OPTIONS, nanoAvailability } from './ai.js';
import { describeResult } from './logic.js';

const status = document.getElementById('status');
const model = document.getElementById('model');
const buttons = document.querySelectorAll('button');

const MODEL_STATES = {
  available: 'On-device AI ready',
  downloadable: 'On-device AI not downloaded — click Group to download',
  downloading: 'On-device AI downloading… — click Group to continue',
  unavailable: 'On-device AI not supported on this device — grouping by site',
  'no-api': 'On-device AI unavailable in this Chrome — grouping by site',
};

function setModel(text, state) {
  model.textContent = text;
  model.dataset.state = state;
}

chrome.commands.getAll().then((commands) => {
  for (const { name, shortcut } of commands) {
    const key = document.querySelector(`[data-action="${name}"] .action__key`);
    if (key && shortcut) {
      key.textContent = shortcut;
      key.hidden = false;
    }
  }
});

let modelState;
let windowId;
chrome.windows.getCurrent().then((w) => {
  windowId = w.id;
});

async function showModelState() {
  const a = await nanoAvailability();
  modelState = a;
  setModel(
    MODEL_STATES[a] ?? 'On-device AI not responding — grouping by site',
    a === 'available'
      ? 'ready'
      : a === 'downloadable' || a === 'downloading'
        ? 'pending'
        : 'off'
  );
}

showModelState();

function startModelDownload() {
  if (modelState !== 'downloadable' && modelState !== 'downloading') return;
  setModel('On-device AI downloading…', 'pending');
  LanguageModel.create({
    ...NANO_OPTIONS,
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        setModel(
          `On-device AI downloading: ${Math.round(e.loaded * 100)}%`,
          'pending'
        );
      });
    },
  }).then(
    (s) => {
      s.destroy();
      modelState = 'available';
      setModel('On-device AI ready — run again for topic grouping', 'ready');
    },
    (e) => {
      setModel(`On-device AI unavailable: ${e.message}`, 'off');
    }
  );
}

for (const b of document.querySelectorAll('[data-action]')) {
  b.addEventListener('click', async () => {
    if (b.dataset.action === 'group-ungrouped') startModelDownload();
    if (
      b.dataset.action === 'group-ungrouped' &&
      modelState !== 'downloadable' &&
      modelState !== 'downloading' &&
      windowId !== undefined
    ) {
      chrome.sidePanel.open({ windowId }).catch(console.warn);
    }
    for (const x of buttons) x.disabled = true;
    status.dataset.tone = 'busy';
    status.textContent = 'Working…';
    const r = await chrome.runtime.sendMessage({ action: b.dataset.action });
    status.dataset.tone = r.ok ? 'ok' : 'error';
    status.textContent = describeResult(r);
    status.title = status.textContent;
    for (const x of buttons) x.disabled = false;
  });
}
