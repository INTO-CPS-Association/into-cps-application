import { ipcRenderer, ipcMain } from 'electron';
import { logWarn } from '../../utils/logger';

export function sendGraphWindowOpen(graphHtmlPath: string): void {
  if (process?.type === 'renderer') {
    ipcRenderer.send('open-graph-window', graphHtmlPath);
  } else if (process?.type === 'browser') {
    ipcMain.emit('open-graph-window', null, graphHtmlPath);
  } else {
    logWarn('[GraphDispatcher] Unknown process type. Unable to send request.');
  }
}