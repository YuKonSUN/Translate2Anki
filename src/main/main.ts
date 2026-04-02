import { app, BrowserWindow, globalShortcut } from 'electron';
import { join } from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/preload.js'),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Global shortcut registration (to be implemented in Task 2)
app.on('ready', () => {
  const ret = globalShortcut.register('CommandOrControl+Shift+T', () => {
    console.log('Translation shortcut pressed');
    // Will trigger translation in Task 2
  });
  if (!ret) {
    console.log('Shortcut registration failed');
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});