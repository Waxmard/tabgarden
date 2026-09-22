const status = document.getElementById('status');
const buttons = document.querySelectorAll('button');

function describe(r) {
  if (!r.ok) return r.error;
  const { closed, grouped, groups } = r.result;
  if (closed !== undefined) return `Closed ${closed} tabs`;
  if (!grouped) return 'Nothing to group';
  return `Grouped ${grouped} tabs into ${groups} groups`;
}

for (const b of document.querySelectorAll('[data-action]')) {
  b.addEventListener('click', async () => {
    for (const x of buttons) x.disabled = true;
    status.textContent = 'Working…';
    const r = await chrome.runtime.sendMessage({ action: b.dataset.action });
    status.textContent = describe(r);
    for (const x of buttons) x.disabled = false;
  });
}

document
  .getElementById('options')
  .addEventListener('click', () => chrome.runtime.openOptionsPage());
