// content.js


function isErudaInitialized() {
  return typeof window.eruda !== 'undefined';
}

function injectEruda() {
  if (isErudaInitialized()) {
    console.log("[Eruda] 已存在，无需重复注入。");
    return;
  }

  console.log("[Eruda] 正在注入...");
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('eruda.min.js');
  script.onload = function() {
    if (typeof eruda !== 'undefined') {
      eruda.init();
      console.log("✅ [Eruda] 初始化成功！");
    } else {
      console.error("❌ [Eruda] 脚本已加载，但 'eruda' 对象未定义。");
    }
  };
  script.onerror = function() {
    console.error("❌ [Eruda] 脚本加载失败，请检查");
  };
  (document.head || document.documentElement).appendChild(script);
}

function removeEruda() {
  if (isErudaInitialized()) {
    console.log("[Eruda] 正在移除...");
    try {
      eruda.destroy();
      console.log("🗑️ [Eruda] 已成功移除。");
    } catch (e) {
      console.error("❌ [Eruda] 移除时发生错误:", e);
    }
  }
}

chrome.storage.local.get(['erudaEnabled'], function(result) {
  if (result.erudaEnabled !== false) {
    injectEruda();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleEruda') {
    if (request.enabled) {
      injectEruda();
    } else {
      removeEruda();
    }
    sendResponse({ success: true });
  } else if (request.action === 'getStatus') {
    sendResponse({ initialized: isErudaInitialized() });
  }
  return true;
});
