import { spawn, ChildProcess } from 'child_process';
import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let maestroProcess: ChildProcess | null = null;

const isDev = process.env.NODE_ENV === 'development';

const preloadPath = isDev
? path.resolve(__dirname, 'preload.js')
: path.resolve(app.getAppPath(), 'dist/preload.js');

const startUrl = isDev
? 'http://localhost:3000'
: `file://${path.resolve(app.getAppPath(), 'dist/index.html')}`; 

const iconPath = isDev
  ? path.resolve(__dirname, 'resources/into-cps/appicon/into-cps-logo.png.ico')
  : path.resolve(app.getAppPath(), 'dist/resources/into-cps/appicon/into-cps-logo.png.ico');

const maestroJarPath = isDev
  ? path.resolve(__dirname, 'resources/maestro/maestro.jar')
  : path.resolve(app.getAppPath(), 'dist/resources/maestro/maestro.jar');

const tempMaestroJarPath = path.join(app.getPath('temp'), 'maestro.jar');


function extractMaestroJar() {
  if (!fs.existsSync(maestroJarPath)) {
    console.error(`Maestro JAR not found at ${maestroJarPath}`);
    throw new Error(`Maestro JAR not found at ${maestroJarPath}`);
  }

  // Extract the JAR to a temporary location
  if (!fs.existsSync(tempMaestroJarPath)) {
    fs.copyFileSync(maestroJarPath, tempMaestroJarPath);
  } else {
    console.log(`Maestro JAR already extracted to ${tempMaestroJarPath}`);
  }
}


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      preload: preloadPath,
    },
  });

  console.log(`Starting Electron in ${isDev ? 'development' : 'production'} mode`);
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

ipcMain.handle('start-maestro', async () => {
  if (maestroProcess) {
    console.log('Maestro is already running.');
    return;
  }

  try {
    extractMaestroJar();

    maestroProcess = spawn('java', ['-jar', tempMaestroJarPath], {
      detached: true,
      stdio: ['ignore', 'inherit', 'inherit'],
    });

    maestroProcess.on('error', (err: Error) => {
      console.error('Error starting Maestro:', err.message);
    });

    maestroProcess.on('close', (code: number | null) => {
      console.log(`Maestro process exited with code: ${code}`);
      maestroProcess = null;
    });

    maestroProcess.unref();
    console.log('Maestro started successfully.');
  } catch (error) {
    console.error('Error starting Maestro:', error);
    throw error;
  }
});

ipcMain.handle('stop-maestro', async () => {
  if (!maestroProcess) {
    console.log('Maestro is not running.');
    return;
  }

  try {
    const pid = maestroProcess.pid;
    if (pid) {
      process.kill(pid, 'SIGTERM');
      console.log('Maestro stopped successfully.');
    }
    maestroProcess = null;
  } catch (error) {
    console.error('Error stopping Maestro:', error);
    throw error;
  }
});