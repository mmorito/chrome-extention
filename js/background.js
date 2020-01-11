var methods = {
  sendMain: sendMain,
  sendSub: sendSub
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
