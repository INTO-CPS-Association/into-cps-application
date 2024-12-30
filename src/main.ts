import { app, ipcMain } from 'electron';
import { createWindow, getMainWindow } from './electron/gui/window';
import { createTopMenu } from './electron/gui/menu';
import { startMaestro, stopMaestro, startSimulation, getSimulationResult } from './cosimulation/maestro';

app.on('ready', () => {
  const mainWindow = createWindow();
  createTopMenu(mainWindow);
});

app.on('activate', () => {
  if (getMainWindow() === null) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


ipcMain.on('toggle-dark-mode', () => {
  getMainWindow()?.webContents.send('toggle-dark-mode');
});

ipcMain.handle('start-maestro', startMaestro);
ipcMain.handle('stop-maestro', stopMaestro);

ipcMain.on('simulation-status-update', (_, status: string) => {
  getMainWindow()?.webContents.send('simulation-status', status);
});

ipcMain.on('start-simulation', async () => {
  await startSimulation();
});

ipcMain.on('trigger-error', (_, message: string) => {
  console.error('[Main] Received Error:', message);
  getMainWindow()?.webContents.send('show-error', message);
});

ipcMain.handle('get-simulation-result', async (event: unknown, sessionId: string) => {
  return await getSimulationResult(sessionId);
});