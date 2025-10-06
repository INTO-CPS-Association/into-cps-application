import { BrowserWindow } from 'electron';
import { logInfo, logError } from '../../utils/logger';
import { MAIN_WINDOW } from "../../utils/constants/ui";
import { PRELOAD_PATH, ICON_PATH } from "../../utils/constants/appMain";
import { IS_DEV } from "../../utils/constants/appShared";
import { MAIN_START_URL } from '../../main';

let mainWindow: BrowserWindow | null = null;
export function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: MAIN_WINDOW.WIDTH,
    height: MAIN_WINDOW.HEIGHT,
    resizable: true,
    icon: ICON_PATH,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: PRELOAD_PATH,
    },
  });

  logInfo(`Starting Electron in ${IS_DEV ? "development" : "production"} mode`);

  mainWindow.loadURL(MAIN_START_URL).catch((error) => {
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