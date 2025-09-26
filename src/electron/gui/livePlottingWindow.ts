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
        setTimeout(() => {
          this._graphWindow?.webContents.send('dark-mode-update', currentDarkMode);
        }, 100);
      }
      return;
    }

    const isDev = process.env.NODE_ENV === 'development';
    const startUrl = isDev
      ? 'http://localhost:3000/#/live-plotting'
      : `file://${path.join(app.getAppPath(), 'dist/index.html')}#/live-plotting`;

    const preloadPath = isDev
      ? path.resolve(__dirname, 'preload.js')
      : path.resolve(app.getAppPath(), 'dist', 'preload.js');

    this._graphWindow = new BrowserWindow({
      width: 800,
      height: 600,
      resizable: true,
      autoHideMenuBar: true,
      backgroundColor: currentDarkMode ? '#1e1e1e' : '#ffffff',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath,
      },
    });

    // Send dark mode update multiple times to ensure synchronization
    if (currentDarkMode !== undefined) {
      this._graphWindow.webContents.on('dom-ready', () => {
        this._graphWindow?.webContents.send('dark-mode-update', currentDarkMode);
      });

      this._graphWindow.webContents.once('did-finish-load', () => {
        this._graphWindow?.webContents.send('dark-mode-update', currentDarkMode);

        setTimeout(() => {
          this._graphWindow?.webContents.send('dark-mode-update', currentDarkMode);
        }, 200);
      });
    }

    this._graphWindow.once('ready-to-show', () => {
      this._graphWindow?.show();
      if (currentDarkMode !== undefined) {
        setTimeout(() => {
          this._graphWindow?.webContents.send('dark-mode-update', currentDarkMode);
        }, 300);
      }
    });

    this._graphWindow.loadURL(startUrl);

    this._graphWindow.on('closed', () => {
      this._graphWindow = null;
    });
  }
}

export const graphWindowManager = new GraphWindowManager();