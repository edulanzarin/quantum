const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // Python
  rodarPython: (args) => ipcRenderer.send("run-python", args),
  aoReceberResposta: (callback) =>
    ipcRenderer.on("python-resposta", (event, dados) => callback(dados)),

  // Diálogos do sistema
  selecionarPasta: () => ipcRenderer.invoke("dialog:select-folder"),
  selecionarArquivo: (options) =>
    ipcRenderer.invoke("dialog:select-file", options),
});
