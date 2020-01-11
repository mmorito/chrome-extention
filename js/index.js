$(function() {
  // 現在アクティブなタブに指示
  function sendToContents(method) {
    chrome.extension.sendMessage({ method: method }, function(response) {
      console.log(response);
    });
  }

  $("#open").click(function(e) {
    e.preventDefault();
    sendToContents("openSub");
  });
});
