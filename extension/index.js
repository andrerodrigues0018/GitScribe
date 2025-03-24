window.addEventListener("message", (event) => {
  if (event.data.action === "requestTexts") {
    chrome.runtime.sendMessage({ action: "getTexts" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Erro ao capturar textos:", chrome.runtime.lastError);
        return;
      }

      document
        .getElementById("viewerFrame")
        .contentWindow.postMessage(
          { action: "updateTexts", data: response },
          "*"
        );
    });
  }
});
