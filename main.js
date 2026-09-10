const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const { app, BrowserWindow, Menu } = new BrowserWindow({
  width: 800,
  height: 600,
  webPreferences: {
    devTools: false
  }
});

document.addEventListener('contextmenu', (e) => e.preventDefault());

document.addEventListener('keydown', (e) => {
  if (
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
    (e.ctrlKey && e.key === 'U')
  ) {
    e.preventDefault();
  }
});

Menu.setApplicationMenu(null);

let mainWindow;
let pyProc;

function startFlask() {
    let serverPath;

    if (app.isPackaged) {
        // Packaged application
        serverPath = path.join(
            process.resourcesPath,
            'server',
            process.platform === 'win32'
                ? 'flask_server.exe'
                : 'flask_server'
        );
    } else {
        // Development/testing
        serverPath = path.join(
            __dirname,
            'dist',
            'flask_server',
            process.platform === 'win32'
                ? 'flask_server.exe'
                : 'flask_server'
        );
    }

    console.log('Starting Flask:', serverPath);

    pyProc = spawn(serverPath, [], {
        cwd: path.dirname(serverPath)
    });

    pyProc.stdout.on('data', (data) => {
        console.log(`Flask: ${data}`);
    });

    pyProc.stderr.on('data', (data) => {
        console.error(`Flask Error: ${data}`);
    });

    pyProc.on('error', (error) => {
        console.error('Failed to start Flask:', error);
    });
}

function checkServerReady(url, callback) {
    http.get(url, (res) => {
        if (res.statusCode === 200) {
            callback();
        } else {
            setTimeout(() => {
                checkServerReady(url, callback);
            }, 200);
        }
    }).on('error', () => {
        setTimeout(() => {
            checkServerReady(url, callback);
        }, 200);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,

        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadURL('http://127.0.0.1:5001');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    startFlask();

    checkServerReady(
        'http://127.0.0.1:5001',
        createWindow
    );
});

app.on('before-quit', () => {
    if (pyProc) {
        pyProc.kill();
    }
});

app.on('window-all-closed', () => {
    if (pyProc) {
        pyProc.kill();
    }

    if (process.platform !== 'darwin') {
        app.quit();
    }
});
