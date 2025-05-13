import { ipcRenderer, ipcMain } from 'electron';

export function sendGraphWindowOpen(livePlotting: string): void {
  if (process?.type === 'renderer') {
    ipcRenderer.send('open-graph-window');
  } else if (process?.type === 'browser') {
    ipcMain.emit('open-graph-window', null);
  }
}