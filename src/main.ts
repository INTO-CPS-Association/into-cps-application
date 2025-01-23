import { app, BrowserWindow, ipcMain } from 'electron';
import { createWindow, getMainWindow } from './electron/gui/window';
import { createTopMenu } from './electron/gui/menu';
import { startMaestro, stopMaestro, startSimulation, getSimulationResult } from './cosimulation/maestro';
import { MaestroResponse } from './types/global';

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
  } else {
    console.error('Main window or webContents is not available.');
  }
});

ipcMain.handle('maestro', async (event, args): Promise<MaestroResponse> => {
  const { type, data } = args;
  try {
    switch (type) {
      case 'start':
        await startMaestro();
        return { success: true, message: 'Maestro started' };

      case 'stop':
        await stopMaestro();
        return { success: true, message: 'Maestro stopped' };

      case 'start-simulation':
        await startSimulation();
        return { success: true, message: 'Simulation started' };

      case 'get-result':
        const resultPath = await getSimulationResult(data?.sessionId);
        return { success: true, resultPath };

      default:
        throw new Error(`Unknown type: ${type}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`[Maestro Handler Error]: ${message}`);
    return { success: false, error: message };
  }
});


ipcMain.on('simulation-status-update', (_, status: string) => {
  getMainWindow()?.webContents.send('simulation-status', status);
});


ipcMain.on('trigger-error', (_, message: string) => {
  console.error('[Main] Received Error:', message);
  getMainWindow()?.webContents.send('show-error', message);
});

ipcMain.handle('get-simulation-result', async (event: unknown, sessionId: string) => {
  return await getSimulationResult(sessionId);
});
