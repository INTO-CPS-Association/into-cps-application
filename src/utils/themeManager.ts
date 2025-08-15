import { BrowserWindow } from 'electron';
import { graphWindowManager } from '../electron/gui/livePlottingWindow';

let mainWindow: BrowserWindow | null = null;

export function registerMainWindow(win: BrowserWindow) {
  mainWindow = win;
}

export function sendDarkModeUpdate(isDark: boolean) {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('dark-mode-update', isDark);
  }

  const graphWindow = graphWindowManager.graphWindow;
  if (graphWindow?.webContents) {
    graphWindow.webContents.send('dark-mode-update', isDark);
  }
}
