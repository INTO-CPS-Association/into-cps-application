import { BrowserWindow } from 'electron';

let graphWindow: BrowserWindow | null = null;

export function openGraphHtmlWindow(graphHtmlPath: string) {
  if (graphWindow && !graphWindow.isDestroyed()) {
    if (graphWindow.isMinimized()) graphWindow.restore();
    graphWindow.focus();
    return;
  }

  graphWindow = new BrowserWindow({
    width: 900,
    height: 700,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  graphWindow.loadFile(graphHtmlPath);

  graphWindow.on('closed', () => {
    graphWindow = null;
  });
}