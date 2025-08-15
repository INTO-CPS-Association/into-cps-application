import { BrowserWindow } from 'electron';
import { graphWindowManager } from '../electron/gui/livePlottingWindow';

let mainWindow: BrowserWindow | null = null;
let currentDarkMode: boolean = false;

export function registerMainWindow(win: BrowserWindow) {
  mainWindow = win;
}

export function setCurrentDarkMode(isDark: boolean) {
  currentDarkMode = isDark;
}

export function getCurrentDarkMode() {
  return currentDarkMode;
}

export function sendDarkModeUpdate(isDark: boolean) {
  currentDarkMode = isDark;

  if (mainWindow?.webContents) {
    mainWindow.webContents.send('dark-mode-update', isDark);
  }

  const graphWindow = graphWindowManager.graphWindow;
  if (graphWindow?.webContents) {
    graphWindow.webContents.send('dark-mode-update', isDark);
  }
}
