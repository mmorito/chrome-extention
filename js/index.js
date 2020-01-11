$(function() {
  // 現在アクティブなタブに指示
  function sendToContents(method) {
    chrome.extension.sendRequest({ method: method }, function(response) {
      console.log(response);
    });
  }

  $("#open").click(function(e) {
    e.preventDefault();
    sendToContents("openSub");
  });
});
