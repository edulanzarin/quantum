const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1280,
    minHeight: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.setMenu(null);
  mainWindow.webContents.openDevTools();
  mainWindow.loadFile(
    path.join(__dirname, "src", "pages", "home", "index.html")
  );
  mainWindow.maximize();
  mainWindow.show();
}

app.whenReady().then(createWindow);

/**
 * Executa scripts Python e retorna os resultados
 */
ipcMain.on("run-python", (event, args) => {
  const scriptPath = path.join(__dirname, "engine", "main.py");

  const params = [
    scriptPath,
    "--modulo",
    args.modulo,
    "--acao",
    args.acao,
    "--dados",
    JSON.stringify(args.dados),
  ];

  const pythonProcess = spawn("python", params);

  pythonProcess.stdout.on("data", (data) => {
    const resultado = data.toString();
    event.sender.send("python-resposta", resultado);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Erro Python: ${data}`);
    event.sender.send(
      "python-resposta",
      JSON.stringify({
        sucesso: false,
        erro: data.toString(),
      })
    );
  });
});

/**
 * Abre diálogo para seleção de pasta
 */
ipcMain.handle("dialog:select-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

/**
 * Abre diálogo para seleção de arquivo
 */
ipcMain.handle("dialog:select-file", async (event, options = {}) => {
  const dialogOptions = {
    properties: ["openFile"],
    filters: options.filters || [],
  };

  const result = await dialog.showOpenDialog(mainWindow, dialogOptions);

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});
