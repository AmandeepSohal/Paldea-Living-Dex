const { app, BrowserWindow, Menu } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let mainWindow;
let pyProc;

function startFlask() {
    let serverPath;

    if (app.isPackaged) {
        // Packaged application
        serverPath = path.join(
            process.resourcesPath,
            'server',
            process.platform === 'win32' ? 'flask_server.exe' : 'flask_server'
        );
    } else {
        // Development/testing
        serverPath = path.join(
            __dirname,
            'dist',
            'flask_server',
            process.platform === 'win32' ? 'flask_server.exe' : 'flask_server'
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
            setTimeout(() => checkServerReady(url, callback), 200);
        }
    }).on('error', () => {
        setTimeout(() => checkServerReady(url, callback), 200);
    });
}

function createWindow() {
    // Disable default menu
    Menu.setApplicationMenu(null);

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            devTools: false,
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Block keyboard shortcuts for DevTools inside the Electron window
    mainWindow.webContents.on('before-input-event', (event, input) => {
        const isF12 = input.key === 'F12';
        const isDevToolsCombo = input.control && input.shift && ['I', 'J', 'C'].includes(input.key.toUpperCase());
        const isViewSourceCombo = input.control && input.key.toUpperCase() === 'U';

        if (isF12 || isDevToolsCombo || isViewSourceCombo) {
            event.preventDefault();
        }
    });

    mainWindow.loadURL('http://127.0.0.1:5001');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    startFlask();
    checkServerReady('http://127.0.0.1:5001', createWindow);
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
