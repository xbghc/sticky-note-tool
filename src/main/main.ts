import { app, BrowserWindow, Menu, Tray, nativeImage, globalShortcut, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// 处理 Squirrel 安装程序事件
if (require('electron-squirrel-startup')) {
  app.quit();
}

// 禁用 GPU 缓存错误
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-gpu');

require('@electron/remote/main').initialize();

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
}

const windowStatePath = path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState(): WindowState {
  try {
    if (fs.existsSync(windowStatePath)) {
      const data = fs.readFileSync(windowStatePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    // 加载窗口状态失败，使用默认值
  }
  
  return {
    x: undefined,
    y: undefined,
    width: 400,
    height: 600
  };
}

function saveWindowState(): void {
  if (!mainWindow) return;
  
  try {
    const bounds = mainWindow.getBounds();
    const windowState: WindowState = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height
    };
    
    fs.writeFileSync(windowStatePath, JSON.stringify(windowState, null, 2));
  } catch (e) {
    // 保存窗口状态失败，忽略错误
  }
}

let mainWindow: BrowserWindow | null;
let tray: Tray | null;

function toggleWindow(): void {
  if (mainWindow) {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.focus();
    }
  }
}

function createWindow(): void {
  const windowState = loadWindowState();
  
  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false,
    icon: path.join(app.getAppPath(), 'assets/icons/256x256.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  require('@electron/remote/main').enable(mainWindow.webContents);

  const htmlPath = path.join(app.getAppPath(), 'src/renderer/index.html');
  mainWindow.loadFile(htmlPath);

  mainWindow.on('close', () => {
    saveWindowState();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process gone:', details);
    mainWindow = null;
  });

  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);

  
  // 始终创建托盘图标
  createTray();
}

function createTray(): void {
  if (tray) return;
  
  const iconPath = path.join(app.getAppPath(), 'assets/icons/32x32.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  
  tray.setToolTip('便签工具');
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏 (Ctrl+Shift+C)',
      click: () => {
        toggleWindow();
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  createWindow();
  
  // 注册全局快捷键 Ctrl + Shift + C (切换显示/隐藏)
  const ret = globalShortcut.register('CommandOrControl+Shift+C', toggleWindow);
  
  if (!ret) {
    // 快捷键注册失败，但不影响程序运行
  }

  // 注册全局快捷键 Ctrl + Shift + I (弹出第一行)
  const ret2 = globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow) {
      mainWindow.webContents.send('pop-first-sentence');
    }
  });
  
  if (!ret2) {
    // 快捷键注册失败，但不影响程序运行
  }
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  saveWindowState();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (tray) {
    tray.destroy();
    tray = null;
  }
});

Menu.setApplicationMenu(null);