import * as path from 'path';
import { BrowserWindow, app } from 'electron';

const isDev = process.env.NODE_ENV === 'development';
const preloadPath = isDev
  ? path.resolve(__dirname, 'preload.js')
  : path.resolve(app.getAppPath(), 'dist/preload.js');

const startUrl = isDev
  ? 'http://localhost:3000'
  : `file://${path.resolve(app.getAppPath(), 'dist/index.html')}`;

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

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}