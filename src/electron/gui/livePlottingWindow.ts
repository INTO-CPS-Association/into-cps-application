import { BrowserWindow, app } from 'electron';
import * as path from 'path';

let graphWindow: BrowserWindow | null = null;

export function openGraphHtmlWindow() {
  if (graphWindow && !graphWindow.isDestroyed()) {
    if (graphWindow.isMinimized()) graphWindow.restore();
    graphWindow.focus();
    return;
  }

  const isDev = process.env.NODE_ENV === 'development';
  const startUrl = isDev
    ? 'http://localhost:3000/#/live-plotting'
    : `file://${path.join(app.getAppPath(), 'dist/index.html')}#/live-plotting`;

  graphWindow = new BrowserWindow({
    width: 900,
    height: 700,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  graphWindow.once('ready-to-show', () => {
    graphWindow?.show();
  });

  graphWindow.loadURL(startUrl);

  graphWindow.on('closed', () => {
    graphWindow = null;
  });
}