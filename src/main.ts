import { app, BrowserWindow, ipcMain } from 'electron';
import { createWindow } from './electron/gui/window';
import { createTopMenu } from './electron/gui/menu';
import { startMaestro, stopMaestro, startSimulation, getSimulationResult } from './cosimulation/maestro';
import { MaestroResponse } from './types/global';
import { getSessionId } from './cosimulation/simulationContext';
import { getConfig } from './utils/config';
import { MaestroNotifications, SimulationStatus } from './utils/constants/cosimulation/statuses';

export let mainWindow: BrowserWindow | null = null;

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
  if (process.platform !== 'darwin') app.quit();
});


ipcMain.on('toggle-dark-mode', () => {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('toggle-dark-mode');
  }
});

let isStartSimulationRunning = false;

ipcMain.handle('maestro', async (event, args): Promise<MaestroResponse> => {
  if (!args || typeof args.type !== 'string') {
    return { success: false, error: 'Invalid arguments provided to maestro handler' };
  }

  const { type, data } = args;
  try {
    switch (type) {
      case 'start':{
        const result = await startMaestro();
        return result;}

      case 'stop':
        await stopMaestro();
        if (mainWindow?.webContents) {
          mainWindow.webContents.send('reset-simulation-state');
        }
        return { success: true, message: MaestroNotifications.Status.MaestroStopped };

        case 'start-simulation':{
          if (isStartSimulationRunning) {
            return { success: false, error: SimulationStatus.SimulationAlreadyInProgress };
          }
  
          isStartSimulationRunning = true; // to avoid unwanted double calls  
          await startSimulation();
          
          isStartSimulationRunning = false;
          return { success: true, message: SimulationStatus.Started };}
  
      case 'get-result':{
        const resultPath = await getSimulationResult(data?.sessionId);
        return { success: true, resultPath };
      }

      default:
        throw new Error(`Unknown type: ${type}`);
    }
  } catch (error) {
    isStartSimulationRunning = false;
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: message };
  }
});

ipcMain.on('trigger-error', (_, message: string) => {
  if (mainWindow?.webContents) {
  mainWindow.webContents.send('show-error', message);
  }
});

ipcMain.handle('get-session-id', async () => {
  const sessionId = getSessionId();
  return sessionId;
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

ipcMain.on('show-notification', (event, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
  console.log(`[Main] Sending notification to renderer: ${message} (${type})`);

  if (mainWindow?.webContents) {
    console.log('[Main] Found mainWindow.webContents, sending event...');
    mainWindow.webContents.send('show-notification', message, type);
  } else {
    console.warn('[Main] mainWindow.webContents is NULL, cannot send notification!');
  }
});

