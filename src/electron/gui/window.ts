import * as path from 'path';
import { BrowserWindow, app } from 'electron';
import { logInfo, logError } from '../../utils/logger';

const isDev = (process.env.NODE_ENV ?? 'production') === 'development';

const preloadPath = isDev
  ? path.resolve(__dirname, 'preload.js')
  : path.resolve(app.getAppPath(), 'preload.js');

const startUrl = isDev
  ? 'http://localhost:3000'
  : `file://${path.join(app.getAppPath(), 'dist', 'index.html')}`;

const iconPath = isDev
  ? path.resolve(__dirname, 'resources/into-cps/appicon/into-cps-logo.png.ico')
  : path.resolve(app.getAppPath(), 'dist/resources/into-cps/appicon/into-cps-logo.png.ico');

let mainWindow: BrowserWindow | null = null;

export function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
  }); 

  logInfo(`Starting Electron in ${isDev ? 'development' : 'production'} mode`);

  mainWindow.loadURL(startUrl).catch((error) => {
    logError('Failed to load URL: ' + error);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}