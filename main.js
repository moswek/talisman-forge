const { app, BrowserWindow, ipcMain, dialog, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');

let mainWindow;
const sessions = new Map();

async function writeCrashLog(kind, error) {
  try {
    const dir = path.join(app.getPath('userData'), 'logs');
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `crash-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
    const body = `[${new Date().toISOString()}] ${kind}\n${error?.stack || error?.message || String(error)}\n`;
    await fs.writeFile(file, body, 'utf8');
  } catch {
    // noop
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#070b16',
    title: 'Talisman Forge',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
}

function emitTerminalEvent(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('terminal:event', payload);
  }
}

ipcMain.handle('app:get-meta', () => ({
  platform: process.platform,
  version: app.getVersion(),
  name: app.getName(),
  theme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
  cwd: process.cwd()
}));

ipcMain.handle('project:save', async (_event, data) => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Export Talisman Forge Project',
    defaultPath: `talisman-forge-project-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });

  if (canceled || !filePath) return { ok: false, canceled: true };

  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  return { ok: true, filePath };
});

ipcMain.handle('project:open', async () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Import Talisman Forge Project',
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });

  if (canceled || !filePaths?.length) return { ok: false, canceled: true };

  const filePath = filePaths[0];
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);

  return { ok: true, filePath, data: parsed };
});

ipcMain.handle('terminal:start', (_event, payload) => {
  const sessionId = payload?.sessionId;
  const command = payload?.command;
  const cwd = payload?.cwd || process.cwd();

  if (!sessionId || !command) {
    return { ok: false, error: 'Missing sessionId or command' };
  }
  if (sessions.has(sessionId)) {
    return { ok: false, error: 'Session already exists' };
  }

  const child = spawn(command, {
    cwd,
    shell: true,
    env: process.env
  });

  sessions.set(sessionId, child);

  emitTerminalEvent({ sessionId, type: 'start', pid: child.pid });

  child.stdout.on('data', (buf) => {
    emitTerminalEvent({ sessionId, type: 'stdout', chunk: String(buf) });
  });

  child.stderr.on('data', (buf) => {
    emitTerminalEvent({ sessionId, type: 'stderr', chunk: String(buf) });
  });

  child.on('close', (code, signal) => {
    sessions.delete(sessionId);
    emitTerminalEvent({ sessionId, type: 'exit', code, signal: signal || null });
  });

  child.on('error', (err) => {
    sessions.delete(sessionId);
    emitTerminalEvent({ sessionId, type: 'error', error: err.message });
  });

  return { ok: true, sessionId, pid: child.pid };
});

ipcMain.handle('terminal:stop', (_event, payload) => {
  const sessionId = payload?.sessionId;
  if (!sessionId || !sessions.has(sessionId)) return { ok: false, error: 'Session not found' };
  const child = sessions.get(sessionId);
  child.kill('SIGTERM');
  return { ok: true };
});

ipcMain.handle('updater:check', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    const info = result?.updateInfo || null;
    return {
      ok: true,
      updateAvailable: Boolean(info && info.version && info.version !== app.getVersion()),
      currentVersion: app.getVersion(),
      latestVersion: info?.version || app.getVersion(),
      channel: info?.channel || 'latest'
    };
  } catch (error) {
    return { ok: false, error: error.message, currentVersion: app.getVersion() };
  }
});

ipcMain.handle('diagnostics:path', async () => {
  const dir = path.join(app.getPath('userData'), 'logs');
  await fs.mkdir(dir, { recursive: true });
  return { ok: true, path: dir };
});

app.whenReady().then(() => {
  process.on('uncaughtException', (err) => {
    writeCrashLog('uncaughtException', err);
  });
  process.on('unhandledRejection', (reason) => {
    writeCrashLog('unhandledRejection', reason);
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
