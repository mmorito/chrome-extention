console.log("sub script ready!");

// 拡張機能とやりとり可能なjsからメッセージを受け取る
window.addEventListener(
  "message",
  event => {
    chrome.runtime.sendMessage(event.data, response => {
      console.log("succeeded.");
    });
  },
  false
);

// background.jsからのメッセージを受け取り、jsへ
chrome.runtime.onMessage.addListener(message => {
  window.postMessage(message, subUrl);
});
