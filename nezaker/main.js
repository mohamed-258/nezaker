const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let pyProc = null;

function isServerHealthy(port = 5500) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/blocks`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(600, () => {
      req.destroy();
      resolve(false);
    });
  });
}

const fs = require('fs');

function getPythonExecutable() {
  if (process.platform === 'win32') {
    const candidatePaths = [
      'C:\\Users\\shawk\\AppData\\Local\\Programs\\Python\\Python311\\python.exe',
      'python'
    ];
    for (const p of candidatePaths) {
      if (p === 'python' || fs.existsSync(p)) return p;
    }
  }
  return 'python';
}

async function startPythonBackend() {
  const isRunning = await isServerHealthy(5500);
  if (isRunning) {
    console.log('[Backend]: Python server already running on port 5500.');
    return;
  }

  const scriptPath = path.join(__dirname, 'server.py');
  const pythonCmd = getPythonExecutable();

  console.log(`[Backend]: Spawning Python backend via ${pythonCmd}...`);
  pyProc = spawn(pythonCmd, [scriptPath], {
    cwd: __dirname,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
  });

  pyProc.stdout.on('data', (data) => {
    console.log(`[Python]: ${data}`);
  });

  pyProc.stderr.on('data', (data) => {
    console.error(`[Python Err]: ${data}`);
  });

  pyProc.on('error', (err) => {
    console.error(`[Python Failed to Spawn]:`, err);
  });
}

async function waitForServerAndLoad(window, maxAttempts = 35) {
  for (let i = 0; i < maxAttempts; i++) {
    const ok = await isServerHealthy(5500);
    if (ok) {
      console.log(`[Backend]: Server is healthy on attempt ${i + 1}. Loading UI...`);
      window.loadURL('http://127.0.0.1:5500');
      return;
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  console.warn('[Backend]: Max poll attempts reached. Attempting direct load...');
  window.loadURL('http://127.0.0.1:5500');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1050,
    minHeight: 720,
    title: 'نذاكر | Nezaker — المنصة الطبية الذكية لطلاب الطب',
    autoHideMenuBar: true,
    backgroundColor: '#090d16',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Enable F12 DevTools and F5 Reload for troubleshooting
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    } else if (input.key === 'F5' && input.type === 'keyDown') {
      mainWindow.reload();
      event.preventDefault();
    }
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.log(`[Electron]: Load failed (${errorCode}: ${errorDescription}). Auto-retrying in 1.2s...`);
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL('http://127.0.0.1:5500');
      }
    }, 1200);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  waitForServerAndLoad(mainWindow);

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (pyProc) {
      try {
        pyProc.kill();
      } catch (e) {}
    }
  });
}

app.whenReady().then(async () => {
  await startPythonBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (pyProc) {
    try {
      pyProc.kill();
    } catch (e) {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
