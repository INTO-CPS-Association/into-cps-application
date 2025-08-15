import { BrowserWindow, app } from 'electron';
import * as path from 'path';

class GraphWindowManager {
  private _graphWindow: BrowserWindow | null = null;

  get graphWindow() {
    return this._graphWindow;
  }

  set graphWindow(win: BrowserWindow | null) {
    this._graphWindow = win;
  }

  openGraphHtmlWindow(currentDarkMode?: boolean) {
    if (this._graphWindow && !this._graphWindow.isDestroyed()) {
      if (this._graphWindow.isMinimized()) this._graphWindow.restore();
      this._graphWindow.focus();
      if (currentDarkMode !== undefined) {
        this._graphWindow.webContents.send('dark-mode-update', currentDarkMode);
      }
      return;
    }

    const isDev = process.env.NODE_ENV === 'development';
    const startUrl = isDev
      ? 'http://localhost:3000/#/live-plotting'
      : `file://${path.join(app.getAppPath(), 'dist/index.html')}#/live-plotting`;

    const preloadPath = isDev
      ? path.resolve(__dirname, 'preload.js')
      : path.resolve(app.getAppPath(), 'preload.js');

    this._graphWindow = new BrowserWindow({
      width: 900,
      height: 700,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath,
      },
    });

    if (currentDarkMode !== undefined) {
      this._graphWindow.webContents.once('did-finish-load', () => {
        this._graphWindow?.webContents.send('dark-mode-update', currentDarkMode);
      });
    }

    this._graphWindow.once('ready-to-show', () => {
      this._graphWindow?.show();
    });

    this._graphWindow.loadURL(startUrl);

    this._graphWindow.on('closed', () => {
      this._graphWindow = null;
    });
  }
}

export const graphWindowManager = new GraphWindowManager();