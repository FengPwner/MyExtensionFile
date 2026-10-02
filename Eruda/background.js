chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    const tab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
    if (!tab || !tab.id) { sendResponse({ ok: false, err: 'no active tab' }); return; }
    try {
      if (msg.action === 'enable') {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['eruda.min.js'],
          world: 'MAIN'
        });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: 'MAIN',
          func: () => { if (window.eruda && !window.eruda._isInit) window.eruda.init(); }
        });
        sendResponse({ ok: true });
      } else if (msg.action === 'disable') {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: 'MAIN',
          func: () => { if (window.eruda) window.eruda.destroy(); }
        });
        sendResponse({ ok: true });
      }
    } catch (e) {
      sendResponse({ ok: false, err: String(e) });
    }
  })();
  return true;
});
