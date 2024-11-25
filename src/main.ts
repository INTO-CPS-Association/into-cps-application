import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import * as path from 'path';
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'resources/into-cps/appicon/', 'into-cps-logo.png.ico'),
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, '../preload.js'),
    },
  });  
  const isDev = process.argv.includes('--dev');

  const startUrl = isDev
    ? 'http://localhost:8080'
    : `file://${path.join(__dirname, 'index.html')}`;

    console.log(
      `Starting Electron in ${isDev ? 'development' : 'production'} mode`,
    );
    console.log(`Loading URL: ${startUrl}`);

  
  mainWindow.loadURL(startUrl).catch((error) => {
    console.error('Failed to load URL:', error);
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTopMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Dark Mode',
          click: () => mainWindow?.webContents.send('toggle-dark-mode'),
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
            mainWindow?.webContents.toggleDevTools();
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template as never);
  Menu.setApplicationMenu(menu);
}

app.on('ready', () => {
  createTopMenu();
  createWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('toggle-dark-mode', () => {
  mainWindow?.webContents.send('toggle-dark-mode');
});