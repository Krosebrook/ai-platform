import { app, BrowserWindow, ipcMain, dialog, Tray, Menu, globalShortcut, nativeImage, clipboard, screen } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { execSync, exec } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    frame: process.platform === 'darwin',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed for better-sqlite3
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('close', (e) => {
    if (tray) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── System Tray ───
function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('AI Platform');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow?.show() },
    { label: 'Quit', click: () => { tray = null; app.quit(); } },
  ]));
  tray.on('click', () => mainWindow?.show());
}

// ─── File I/O IPC ───
ipcMain.handle('read-file', async (_e, filePath: string) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (_e, filePath: string, content: string) => {
  try {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('list-directory', async (_e, dirPath: string) => {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return {
      success: true,
      entries: entries.map(e => ({
        name: e.name,
        isDirectory: e.isDirectory(),
        path: path.join(dirPath, e.name),
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-file', async (_e, filePath: string) => {
  try {
    await fs.promises.unlink(filePath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file-exists', async (_e, filePath: string) => {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
});

// ─── Dialog IPC ───
ipcMain.handle('pick-file', async (_e, options?: Electron.OpenDialogOptions) => {
  const result = await dialog.showOpenDialog(mainWindow!, { properties: ['openFile'], ...options });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('pick-directory', async (_e) => {
  const result = await dialog.showOpenDialog(mainWindow!, { properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('save-file-dialog', async (_e, options?: Electron.SaveDialogOptions) => {
  const result = await dialog.showSaveDialog(mainWindow!, options || {});
  return result.canceled ? null : result.filePath;
});

// ─── Clipboard IPC ───
ipcMain.handle('clipboard-read', () => clipboard.readText());
ipcMain.handle('clipboard-write', (_e, text: string) => clipboard.writeText(text));

// ─── Shell / Git IPC ───
ipcMain.handle('shell-exec', async (_e, command: string, cwd?: string) => {
  return new Promise((resolve) => {
    exec(command, { cwd, timeout: 30000 }, (error, stdout, stderr) => {
      resolve({ success: !error, stdout, stderr, error: error?.message });
    });
  });
});

// ─── Workflow IPC ───
ipcMain.handle('trigger-workflow', async (_e, webhookUrl: string, payload: any) => {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-status', async (_e, statusUrl: string) => {
  try {
    const response = await fetch(statusUrl);
    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// ─── Platform Info IPC ───
ipcMain.handle('get-platform-info', () => ({
  platform: process.platform,
  isElectron: true,
  appPath: app.getPath('userData'),
  homePath: app.getPath('home'),
}));

// ─── App Lifecycle ───
app.whenReady().then(() => {
  createWindow();
  createTray();

  // Global hotkey: Ctrl+Shift+Space for command palette
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.webContents.send('toggle-command-palette');
    } else {
      mainWindow?.show();
      setTimeout(() => mainWindow?.webContents.send('toggle-command-palette'), 200);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
