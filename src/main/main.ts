import * as electron from 'electron';
import { join } from 'path';
import { ShortcutManager } from './shortcutManager';
import { ClipboardManager } from './clipboardManager';

const { app, BrowserWindow, ipcMain, Tray, Menu, screen } = electron;

let mainWindow: electron.BrowserWindow | null = null;
let tray: electron.Tray | null = null;
const shortcutManager = new ShortcutManager();
const clipboardManager = new ClipboardManager();

// 判断是否在开发环境
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 700,
    show: false, // 初始不显示
    frame: false, // 无边框
    resizable: false,
    skipTaskbar: true, // 不在任务栏显示
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/preload.js'),
    },
  });

  if (isDev) {
    const port = process.env.PORT || '5173';
    mainWindow.loadURL(`http://localhost:${port}`);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // 窗口失去焦点时隐藏
  mainWindow.on('blur', () => {
    mainWindow?.hide();
  });

  // 窗口关闭时只是隐藏，不退出
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

function createTray() {
  // 使用简单的 emoji 作为托盘图标（生产环境应该用真实图标文件）
  tray = new Tray(join(__dirname, '../../assets/tray-icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示 Translate2Anki',
      click: () => {
        mainWindow?.show();
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Translate2Anki');
  tray.setContextMenu(contextMenu);

  // 点击托盘图标显示窗口
  tray.on('click', () => {
    mainWindow?.show();
  });
}

// 在鼠标位置显示窗口
function showWindowAtCursor() {
  if (!mainWindow) return;

  const cursorPosition = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursorPosition);
  
  // 计算窗口位置（鼠标右下方）
  let x = cursorPosition.x + 10;
  let y = cursorPosition.y + 10;

  // 确保窗口不超出屏幕
  const windowBounds = mainWindow.getBounds();
  const displayBounds = display.workArea;

  if (x + windowBounds.width > displayBounds.x + displayBounds.width) {
    x = cursorPosition.x - windowBounds.width - 10;
  }
  if (y + windowBounds.height > displayBounds.y + displayBounds.height) {
    y = cursorPosition.y - windowBounds.height - 10;
  }

  mainWindow.setPosition(Math.max(0, x), Math.max(0, y));
  mainWindow.show();
  mainWindow.focus();
}

// 获取选中的文本（使用剪贴板技巧）
async function getSelectedText(): Promise<string> {
  // 保存当前剪贴板内容
  const originalText = clipboardManager.readText();
  
  // 模拟复制操作（发送 Ctrl+C）
  // 注意：这需要系统权限，在某些应用可能不起作用
  // 更好的方法是使用 native 模块或 robotjs
  
  // 等待一小段时间让复制完成
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // 读取新的剪贴板内容
  const selectedText = clipboardManager.readValidText();
  
  // 恢复原始剪贴板内容
  clipboardManager.writeText(originalText);
  
  return selectedText;
}

// 全局快捷键回调
async function handleTranslationShortcut() {
  console.log('Translation shortcut pressed');

  // 获取选中的文本
  const selectedText = await getSelectedText();
  console.log('Selected text:', selectedText);

  if (!selectedText) {
    console.log('No valid text selected');
    return;
  }

  // 在鼠标位置显示窗口
  showWindowAtCursor();

  // 发送文本到渲染进程
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('text-selected', selectedText);
  }
}

// IPC handler for clipboard text requests
ipcMain.handle('get-clipboard-text', async () => {
  return clipboardManager.readText();
});

// IPC: 关闭窗口（隐藏到托盘）
ipcMain.handle('hide-window', () => {
  mainWindow?.hide();
});

// IPC: 退出应用
ipcMain.handle('quit-app', () => {
  app.isQuiting = true;
  app.quit();
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    // macOS: 点击 dock 图标时重新创建窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // 所有平台：保持后台运行
  // 不调用 app.quit()，让应用继续在托盘运行
});

// 注册全局快捷键
app.on('ready', () => {
  const ret = shortcutManager.register('CommandOrControl+Shift+T', handleTranslationShortcut);

  if (!ret) {
    console.log('Shortcut registration failed');
  } else {
    console.log('Translation shortcut registered: Ctrl+Shift+T (Cmd+Shift+T on Mac)');
  }
});

// 清理快捷键
app.on('will-quit', () => {
  shortcutManager.unregisterAll();
});

// 防止多次启动实例
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // 有人试图启动第二个实例，显示已有窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}
