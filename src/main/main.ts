import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import { join } from 'path';
import { ShortcutManager } from './shortcutManager';
import { ClipboardManager } from './clipboardManager';

let mainWindow: BrowserWindow | null = null;
const shortcutManager = new ShortcutManager();
const clipboardManager = new ClipboardManager();

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

// IPC handler for clipboard text requests
ipcMain.handle('get-clipboard-text', async () => {
  return clipboardManager.readText();
});

// Global shortcut callback
function handleTranslationShortcut() {
  console.log('Translation shortcut pressed');

  // Read text from clipboard
  const clipboardText = clipboardManager.readText();
  console.log('Clipboard text:', clipboardText);

  // Send clipboard text to renderer if window exists
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('clipboard-text', clipboardText);
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

// Register global shortcut for translation
app.on('ready', () => {
  const ret = shortcutManager.register('CommandOrControl+Shift+T', handleTranslationShortcut);

  if (!ret) {
    console.log('Shortcut registration failed');
  } else {
    console.log('Translation shortcut registered: Ctrl+Shift+T (Cmd+Shift+T on Mac)');
  }
});

// Clean up shortcuts on quit
app.on('will-quit', () => {
  shortcutManager.unregisterAll();
});