var methods = {
  sendMain: sendMain,
  sendSub: sendSub,
  onOpenMain: onOpenMain,
  onCloseMain: onCloseMain,
  openSub: openSub
};

// main or sub からのメッセージを受け取る
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (!message.method || !methods[message.method]) return true;
  console.log("call: " + message.method);
  methods[message.method](message);
  return true;
});

// Public
// Main --> Sub データ転送（呼出元: Main）
function sendSub(message) {
  getSubId().then(subId => {
    if (!subId) return true;
    console.log("subId: " + subId);
    console.dir(message);
    chrome.tabs.sendMessage(subId, message, response => {
      console.log("succeeded.");
    });
  });
}

// Sub --> Main データ転送（呼出元: Sub）
function sendMain(message) {
  getActiveTabId().then(activeId => {
    console.log("activeId: " + activeId);
    console.dir(message);
    chrome.tabs.sendMessage(activeId, message, response => {
      console.log("succeeded.");
    });
  });
}

function onOpenMain(message) {
  Promise.all([getSubId(), getActiveTabId()]).then(res => {
    var subId = res[0];
    var activeId = res[1];
    console.log("start openReport. subId: " + subId + "activeId: " + activeId);
    console.dir(message);
    message["tabId"] = activeId;
    refreshTabs(message).then(tabs => {
      if (!subId) return true;
      message["tabs"] = tabs;
      chrome.tabs.sendMessage(subId, message, response => {
        console.log("succeeded.");
      });
    });
  });
}

function onCloseMain(message) {
  Promise.all([getSubId(), getActiveTabId()]).then(res => {
    var subId = res[0];
    var activeId = res[1];
    refreshTabs(message, activeId).then(tabs => {
      chrome.tabs.sendMessage(
        subId,
        { from: "MAIN", method: "onOpenMain", tabs: tabs },
        response => {
          console.log("succeeded.");
        }
      );
    });
  });
}

// Subを別タブに開く（既に存在する場合はactiveのみ）
chrome.browserAction.onClicked.addListener(tab => openSub());
function openSub() {
  getSubId().then(
    subId => {
      if (subId) {
        // Subウインドウが既に存在すれば再度開かない
        chrome.tabs.update(subId, { active: true }, tab => {});
        return;
      }
      chrome.tabs.create({ url: subUrl, active: true }, tab => {});
    },
    err => {}
  );
}

// Private
// SubウインドウのタブIdを返却する
function getSubId() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ url: subUrl + "/*" }, tabs => {
      console.dir(tabs);
      if (!tabs || tabs.length === 0) {
        resolve(null);
        return;
      }
      resolve(tabs[0].id);
    });
  });
}

// 現在ActiveなタブIdを返却する
function getActiveTabId() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      resolve(tabs[0].id);
    });
  });
}

// SubウインドウのIDを返却する
function getSub(sendResponse) {
  sendResponse({ id: getSubId() });
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (tab.url.indexOf(subUrl) < 0) return;
  refreshTabs({}).then(tabs => {
    console.log("window updated. url: " + tab.url);
    chrome.tabs.sendMessage(
      tab.id,
      { from: "LOOKREC", method: "openReport", tabs: tabs },
      response => {
        console.log("succeeded.");
      }
    );
  });
});

function refreshTabs(message, closeTabId) {
  return new Promise((resolve, reject) => {
    var t1 = localStorage.getItem("main-tabs");
    if (t1) t1 = JSON.parse(t1);
    t1 = t1 || [];
    chrome.tabs.query({ url: mainUrl + "/*" }, t2 => {
      var tabs = [];
      if (t2 && t2.length > 0) {
        for (var i = 0; i < t2.length; i++) {
          if (Number(t2[i].id) === Number(closeTabId)) continue;
          var exist = false;
          if (Number(message.tabId) === Number(t2[i].id)) {
            tabs.push({ id: t2[i].id, info: message.info });
            exist = true;
            continue;
          }
          for (var j = 0; j < t1.length; j++) {
            if (Number(t2[i].id) === Number(t1[j].id)) {
              tabs.push({ id: t2[i].id, info: t1[j].info });
              exist = true;
              break;
            }
          }
          if (!exist) tabs.push({ id: t2[i].id, info: "unknown" });
        }
      }
      localStorage.setItem("main-tabs", JSON.stringify(tabs));
      resolve(tabs);
    });
  });
}

chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    type: "normal",
    id: "open-sub",
    title: "Sub画面を開く"
  });
});
chrome.contextMenus.onClicked.addListener(item => {
  if (item.menuItemId === "open-sub") openSub();
});
