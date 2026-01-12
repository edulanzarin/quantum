const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    rodarPython: (args) => ipcRenderer.send('run-python', args),
    aoReceberResposta: (callback) => ipcRenderer.on('python-resposta', (event, dados) => callback(dados))
});