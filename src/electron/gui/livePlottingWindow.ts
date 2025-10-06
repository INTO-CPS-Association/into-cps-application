import { BrowserWindow } from 'electron';
import { DARK_MODE_RETRY_INTERVALS, GRAPH_WINDOW, LIGHTCOLORS, DARKCOLORS, LivePlottingErrors } from "../../utils/constants";
import { PRELOAD_PATH } from "../../utils/constants/appMain";
import { GRAPH_START_URL } from '../../main';

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
        }, DARK_MODE_RETRY_INTERVALS[0]);
      }
      return;
    }

    this._graphWindow = new BrowserWindow({
      width: GRAPH_WINDOW.WIDTH,
      height: GRAPH_WINDOW.HEIGHT,
      resizable: true,
      autoHideMenuBar: true,
      backgroundColor: currentDarkMode ? DARKCOLORS.BACKGROUND.PAPER : LIGHTCOLORS.BACKGROUND.PAPER,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: PRELOAD_PATH,
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
        }, DARK_MODE_RETRY_INTERVALS[1]);
      });
    }

    this._graphWindow.once('ready-to-show', () => {
      this._graphWindow?.show();
      if (currentDarkMode !== undefined) {
        setTimeout(() => {
          this._graphWindow?.webContents.send('dark-mode-update', currentDarkMode);
        }, DARK_MODE_RETRY_INTERVALS[2]);
      }
    });

    this._graphWindow.loadURL(GRAPH_START_URL).catch((err: Error) => {
      console.error(LivePlottingErrors.FailedToLoad, err);
    });;

    this._graphWindow.on('closed', () => {
      this._graphWindow = null;
    });
  }
}

export const graphWindowManager = new GraphWindowManager();