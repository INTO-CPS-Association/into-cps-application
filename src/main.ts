import { app, BrowserWindow, ipcMain, nativeTheme, shell } from 'electron';
import * as path from "path";
import * as url from "url";
import fs from 'fs';
import { createWindow } from './electron/gui/window';
import { createTopMenu } from './electron/gui/menu';
import { graphWindowManager } from './electron/gui/livePlottingWindow';
import { getLatestSimulationFolder, startSimulation } from './cosimulation/maestro';
import { getConfig, setProjectPath } from './utils/config';
import { SimulationStatus } from './utils/constants/cosimulation/statuses';
import { logInfo, logWarn } from './utils/logger';
import { getCurrentDarkMode, registerMainWindow, sendDarkModeUpdate } from './utils/themeManager';
import { MaestroResponse, NotificationType } from './types/global';
import { IS_DEV } from './utils/constants/appShared';

export let mainWindow: BrowserWindow | null = null;

export const MAIN_START_URL = IS_DEV
  ? "http://localhost:3000"
  : url.format({
    pathname: path.join(app.getAppPath(), "dist/index.html"),
    protocol: "file:",
    slashes: true,
  });

export const GRAPH_START_URL = IS_DEV
  ? "http://localhost:3000/#/live-plotting"
  : url.format({
    pathname: path.join(app.getAppPath(), "dist/index.html"),
    protocol: "file:",
    slashes: true,
  }) + "#/live-plotting";

let darkMode = nativeTheme.shouldUseDarkColors;
const platform = process.platform as NodeJS.Platform;

// Helper function to send simulation status to all windows
function broadcastSimulationStatus(status: string) {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('simulation-status', status);
  }
  if (graphWindowManager.graphWindow?.webContents) {
    graphWindowManager.graphWindow.webContents.send('simulation-status', status);
  }
}

app.on('ready', () => {
  mainWindow = createWindow();
  registerMainWindow(mainWindow);

  mainWindow.once('ready-to-show', () => {
    createTopMenu(mainWindow!);
    sendDarkModeUpdate(darkMode);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      sendDarkModeUpdate(darkMode);
    }, 100);
  });
});

ipcMain.on('toggle-dark-mode', () => {
  darkMode = !darkMode;
  sendDarkModeUpdate(darkMode);
});

ipcMain.on('update-dark-mode', (_event, isDark: boolean) => {
  darkMode = isDark;
  sendDarkModeUpdate(isDark);
});

ipcMain.handle('get-dark-mode', () => {
  return darkMode;
});

nativeTheme.on('updated', () => {
  const systemDarkMode = nativeTheme.shouldUseDarkColors;
  darkMode = systemDarkMode;
  sendDarkModeUpdate(darkMode);
});

app.on('activate', () => {
  if (!mainWindow) {
    mainWindow = createWindow();
    mainWindow.once('ready-to-show', () => {
      createTopMenu(mainWindow!);
      sendDarkModeUpdate(darkMode);
    });
  }
});

app.on('window-all-closed', () => {
  if (platform !== 'darwin') app.quit();
});

ipcMain.on("create-project", async (_, projectPath: string) => {
  try {
    setProjectPath(projectPath);
    await fs.promises.access(projectPath, fs.constants.F_OK | fs.constants.W_OK);
    
    mainWindow?.webContents.send("project-created", projectPath);
    mainWindow?.webContents.send("show-notification", "Project created successfully!", "success");
    mainWindow?.webContents.send("simulation-status", "Project created successfully");
  } catch (err) {
    console.error(err);
    mainWindow?.webContents.send(
      "show-error",
      `Failed to create project: ${err instanceof Error ? err.message : err}`
    );
  }
});

ipcMain.handle('maestro', async (event, args): Promise<MaestroResponse> => {
  if (!args || typeof args.type !== 'string') {
    return { success: false, error: 'Invalid arguments provided to maestro handler' };
  }

  const { type } = args;

  try {
    switch (type) {
      case 'start-simulation': {
        console.log('[Main] Starting simulation request...');
        broadcastSimulationStatus(SimulationStatus.StartingSimulation);

        graphWindowManager.openGraphHtmlWindow(getCurrentDarkMode());

        const result = await startSimulation();
        broadcastSimulationStatus(result.status);
        
        if (!result.success) {
          return { success: false, error: result.error || 'Failed to start simulation.' };
        }

        return { success: true, message: result.status };
      }

      default:
        throw new Error(`Unknown type: ${type}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    broadcastSimulationStatus(SimulationStatus.SimulationFailed);
    return { success: false, error: message };
  }
  });

ipcMain.on('simulation-status-update', (_, status: string) => {
  console.log('[Main] Received simulation status update:', status);
  broadcastSimulationStatus(status);
});

ipcMain.on('trigger-error', (_, message: string) => {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('show-error', message);
  }
});

ipcMain.handle('get-config', async () => {
  const config = getConfig();
  return config;
});

ipcMain.on('trigger-notification', (_, message: string, type) => {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('show-notification', message, type);
  }
});

ipcMain.on('show-notification', (event, message: string, type: NotificationType) => {
  logInfo(`[Main] Sending notification to renderer: ${message} (${type})`);
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('show-notification', message, type);
  } else {
    logWarn('[Main] mainWindow.webContents is NULL, cannot send notification.');
  }
});

ipcMain.handle('read-file', async (_, path) => {
  return fs.promises.readFile(path, 'utf8');
});

ipcMain.handle('write-file', async (_, { path, content }) => {
  return fs.promises.writeFile(path, content, 'utf8');
});

ipcMain.handle('get-latest-result-folder', () => {
  return getLatestSimulationFolder();
});

ipcMain.on('open-graph-window', () => {
  graphWindowManager.openGraphHtmlWindow(getCurrentDarkMode());
});

ipcMain.handle('open-folder', async (_, folderPath: string) => {
  const errorMessage = await shell.openPath(folderPath);
  
  if (errorMessage) {
    console.error(`[Main] Failed to open folder: ${errorMessage}`);
  }
  
  return errorMessage;
});