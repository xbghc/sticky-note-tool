import { app, BrowserWindow, Menu, Tray, nativeImage, globalShortcut } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

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

const windowStatePath = path.join(__dirname, 'window-state.json');

function loadWindowState(): WindowState {
  try {
    if (fs.existsSync(windowStatePath)) {
      const data = fs.readFileSync(windowStatePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load window state:', e);
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
    console.error('Failed to save window state:', e);
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
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  require('@electron/remote/main').enable(mainWindow.webContents);

  mainWindow.loadFile(path.join(__dirname, '../../src/renderer/index.html'));

  mainWindow.on('close', () => {
    saveWindowState();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);

  
  // 始终创建托盘图标
  createTray();
}

function createTray(): void {
  if (tray) return;
  
  const icon = nativeImage.createFromPath(path.join(__dirname, '../../assets/icon.png')).resize({ width: 16, height: 16 });
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
  
  if (ret) {
    console.log('Ctrl + Shift + C 快捷键注册成功');
  } else {
    console.log('快捷键注册失败');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

Menu.setApplicationMenu(null);