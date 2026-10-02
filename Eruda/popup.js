const toggle = document.getElementById('toggle');
toggle.addEventListener('change', async () => {
  const action = toggle.checked ? 'enable' : 'disable';
  const res = await chrome.runtime.sendMessage({ action });
  chrome.storage.local.set({ erudaEnabled: toggle.checked });
  if (!res?.ok) console.warn('inject failed:', res?.err);
});
