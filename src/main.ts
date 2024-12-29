import * as path from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { createTopMenu } from './main/menu';
import { startMaestro, stopMaestro, startSimulation, getSimulationResult } from './main/maestro/maestroManager';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';
process.env.NODE_ENV = process.env.NODE_ENV || (isDev ? 'development' : 'production');

const preloadPath = isDev
  ? path.resolve(__dirname, 'preload.js')
  : path.resolve(app.getAppPath(), 'dist/preload.js');

const startUrl = isDev
  ? 'http://localhost:3000'
  : `file://${path.resolve(app.getAppPath(), 'dist/index.html')}`;

const iconPath = isDev
  ? path.resolve(__dirname, 'resources/into-cps/appicon/into-cps-logo.png.ico')
  : path.resolve(app.getAppPath(), 'dist/resources/into-cps/appicon/into-cps-logo.png.ico');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      preload: preloadPath,
    },
  });

  console.log(`Starting Electron in ${isDev ? 'development' : 'production'} mode`);
  console.log(`Loading URL: ${startUrl}`);

  mainWindow.loadURL(startUrl).catch((error) => {
    console.error('Failed to load URL:', error);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();
  createTopMenu(mainWindow);
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('toggle-dark-mode', () => {
  mainWindow?.webContents.send('toggle-dark-mode');
});

ipcMain.handle('start-maestro', startMaestro);
ipcMain.handle('stop-maestro', stopMaestro);
ipcMain.on('simulation-status-update', (_, status: string) => {
  mainWindow?.webContents.send('simulation-status', status);
});

ipcMain.on('start-simulation', async () => {
  await startSimulation();
});
ipcMain.handle('get-simulation-result', async (event: unknown, sessionId: string) => {
  return await getSimulationResult(sessionId);
});
