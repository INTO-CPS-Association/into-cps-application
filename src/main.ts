import { app, BrowserWindow, ipcMain } from 'electron';
import { createWindow } from './electron/gui/window';
import { createTopMenu } from './electron/gui/menu';
import { getLatestSimulationFolder, startSimulation } from './cosimulation/maestro';
import { MaestroResponse, NotificationType } from './types/global';
import { getConfig } from './utils/config';
import { SimulationStatus } from './utils/constants/cosimulation/statuses';
import { logInfo, logWarn } from './utils/logger';

import fs from 'fs';

export let mainWindow: BrowserWindow | null = null;

const platform = process.platform as NodeJS.Platform;

app.on('ready', () => {
  mainWindow = createWindow();
  mainWindow.once('ready-to-show', () => {
    createTopMenu(mainWindow!);
  });
});

app.on('activate', () => {
  if (!mainWindow) {
    mainWindow = createWindow();
    mainWindow.once('ready-to-show', () => {
      createTopMenu(mainWindow!);
    });
  }
});

app.on('window-all-closed', () => {
  if (platform !== 'darwin') app.quit();
});

ipcMain.on('toggle-dark-mode', () => {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('toggle-dark-mode');
  }
});

let startSimulationRunning = false;

ipcMain.handle('maestro', async (event, args): Promise<MaestroResponse> => {
  if (!args || typeof args.type !== 'string') {
    return { success: false, error: 'Invalid arguments provided to maestro handler' };
  }

  const { type } = args;

  try {
    switch (type) {
      case 'start-simulation': {
        if (startSimulationRunning) {
          return { success: false, error: SimulationStatus.SimulationAlreadyInProgress };
        }

        startSimulationRunning = true;

        const result = await startSimulation();

        if (mainWindow?.webContents) {
          mainWindow.webContents.send('simulation-status', result.status);
        }

        if (!result.success) {
          return { success: false, error: result.error || 'Failed to start simulation.' };
        }

        return { success: true, message: SimulationStatus.Started };
      }

      default:
        throw new Error(`Unknown type: ${type}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: message };
  } finally {
    startSimulationRunning = false;
  }
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