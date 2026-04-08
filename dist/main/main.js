"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron = __importStar(require("electron"));
const path_1 = require("path");
const shortcutManager_1 = require("./shortcutManager");
const clipboardManager_1 = require("./clipboardManager");
const { app, BrowserWindow, ipcMain } = electron;
console.log('Electron module keys:', Object.keys(electron));
console.log('app:', app);
console.log('BrowserWindow:', BrowserWindow);
console.log('ipcMain:', ipcMain);
let mainWindow = null;
const shortcutManager = new shortcutManager_1.ShortcutManager();
const clipboardManager = new clipboardManager_1.ClipboardManager();
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: (0, path_1.join)(__dirname, '../preload/preload.js'),
        },
    });
    if (process.env.NODE_ENV === 'development') {
        const port = process.env.PORT || '5173';
        mainWindow.loadURL(`http://localhost:${port}`);
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile((0, path_1.join)(__dirname, '../renderer/index.html'));
    }
}
// IPC handler for clipboard text requests
ipcMain.handle('get-clipboard-text', async () => {
    return clipboardManager.readText();
});
// Global shortcut callback
function handleTranslationShortcut() {
    console.log('Translation shortcut pressed');
    // Read and validate text from clipboard
    const clipboardText = clipboardManager.readValidText();
    console.log('Clipboard text:', clipboardText);
    // Only send if there's valid text
    if (!clipboardText) {
        console.log('No valid text in clipboard, skipping...');
        // Show notification to user
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('text-selected', '');
        }
        return;
    }
    // Send clipboard text to renderer if window exists
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('text-selected', clipboardText);
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
    }
    else {
        console.log('Translation shortcut registered: Ctrl+Shift+T (Cmd+Shift+T on Mac)');
    }
});
// Clean up shortcuts on quit
app.on('will-quit', () => {
    shortcutManager.unregisterAll();
});
