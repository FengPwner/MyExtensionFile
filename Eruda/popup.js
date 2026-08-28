// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const erudaSwitch = document.getElementById('erudaSwitch');
  const statusDiv = document.getElementById('status');
  const refreshBtn = document.getElementById('refreshBtn');

  initializePopup();

  erudaSwitch.addEventListener('change', handleToggle);
  refreshBtn.addEventListener('click', refreshCurrentTab);

  async function initializePopup() {
    try {
      const result = await chrome.storage.local.get(['erudaEnabled']);
      const isEnabled = result.erudaEnabled !== false; // 默认为 true
      erudaSwitch.checked = isEnabled;
      
      updateStatus(isEnabled ? '已全局启用' : '已全局禁用', isEnabled);

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
          if (response?.initialized) {
            statusDiv.textContent = '✅ 当前页面运行中';
            statusDiv.className = 'status active';
          } else {
            statusDiv.textContent += ' (点击开关注入)';
          }
        } catch (error) {
          statusDiv.textContent += ' (需刷新页面)';
        }
      }
    } catch (error) {
      console.error('[Eruda] 初始化失败:', error);
      statusDiv.textContent = '初始化出错';
    }
  }

  async function handleToggle() {
    const enabled = erudaSwitch.checked;
    try {
      await chrome.storage.local.set({ erudaEnabled: enabled });
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'toggleEruda', enabled: enabled });
          showStatus(enabled ? '✅ 注入成功' : '🗑️ 已移除', true);
        } catch (error) {
          showStatus('⚠️ 请刷新页面生效', false);
        }
      }
    } catch (error) {
      console.error('[Eruda] 切换失败:', error);
      showStatus('❌ 操作失败', false);
      erudaSwitch.checked = !enabled;
    }
  }

  async function refreshCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.reload(tab.id);
      window.close();
    }
  }

  function updateStatus(text, isActive) {
    statusDiv.textContent = text;
    statusDiv.className = isActive ? 'status active' : 'status inactive';
  }

  function showStatus(message, isSuccess) {
    statusDiv.textContent = message;
    statusDiv.className = isSuccess ? 'status active' : 'status inactive';
    
    setTimeout(() => {
      initializePopup();
    }, 2000);
  }
});
