const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 1200,
        minHeight: 800,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.setMenu(null);
    mainWindow.webContents.openDevTools();
    mainWindow.loadFile(path.join(__dirname, 'src', 'pages', 'home', 'index.html'));
    mainWindow.maximize();
    mainWindow.show();
}

app.whenReady().then(createWindow);

ipcMain.on('run-python', (event, args) => {
    const scriptPath = path.join(__dirname, 'engine', 'main.py');

    const params = [
        scriptPath,
        '--modulo', args.modulo,
        '--acao', args.acao,
        '--dados', JSON.stringify(args.dados)
    ];

    const pythonProcess = spawn('python', params);

    pythonProcess.stdout.on('data', (data) => {
        const resultado = data.toString();
        event.sender.send('python-resposta', resultado);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Erro Python: ${data}`);
        event.sender.send('python-resposta', JSON.stringify({
            sucesso: false,
            erro: data.toString()
        }));
    });
});