const panel = document.getElementById('panel');
const title = document.getElementById('title');
const detail = document.getElementById('detail');
const icon = document.getElementById('icon');
const FRESH_MS = 10000;
let closeTimer;

function render({ state, text, at }) {
  if ((state === 'done' || state === 'error') && Date.now() - at > FRESH_MS) {
    state = 'idle';
  }
  panel.dataset.state = state;
  clearTimeout(closeTimer);
  if (state === 'running') {
    icon.textContent = '';
    title.textContent = 'Grouping tabs…';
    detail.textContent = '';
  } else if (state === 'done' || state === 'error') {
    icon.textContent = state === 'done' ? '✓' : '!';
    title.textContent = state === 'done' ? 'Done' : 'Grouping failed';
    detail.textContent = text;
    closeTimer = setTimeout(
      () => window.close(),
      state === 'done' ? 2000 : 4000
    );
  } else {
    icon.textContent = '';
    title.textContent = 'tabgarden';
    detail.textContent =
      'Press Alt+Shift+G or use the toolbar button to group tabs.';
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'group-status') render(msg);
});
chrome.runtime.sendMessage({ action: 'group-status' }).then(render);
