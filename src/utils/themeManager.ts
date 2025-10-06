import { BrowserWindow } from 'electron';
import { graphWindowManager } from '../electron/gui/livePlottingWindow';

let mainWindow: BrowserWindow | null = null;
let currentDarkMode: boolean = false;

export function registerMainWindow(win: BrowserWindow) {
  mainWindow = win;
}

export function getCurrentDarkMode() {
  return currentDarkMode;
}

export function sendDarkModeUpdate(isDark: boolean) {
  currentDarkMode = isDark;

  const windows = [mainWindow, graphWindowManager.graphWindow];

  windows.forEach((win) => {
    if (win?.webContents) win.webContents.send('dark-mode-update', isDark);
  });
}