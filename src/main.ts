  import { app, BrowserWindow, Menu, ipcMain } from 'electron';
  import * as path from 'path';
  import * as fs from 'fs';
  import { spawn, ChildProcess } from 'child_process';
  import kill from 'tree-kill';

  let mainWindow: BrowserWindow | null = null;
  let coeProcess: ChildProcess | null = null;

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
      {
        label: 'Cosimulation',
        submenu: [
          {
            label: 'Start',
            accelerator: process.platform === 'darwin' ? 'Cmd+F2' : 'Alt+F2',
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

  ipcMain.handle('read-json-file', async (event, relativePath) => {
    try {
      const basePath = path.join(app.getAppPath(), 'resources');
      const fullPath = path.join(basePath, relativePath);
      console.log('Reading JSON file from:', fullPath);
  
      const rawData = fs.readFileSync(fullPath, 'utf8');
      console.log('Raw data:', rawData);
  
      const jsonData = JSON.parse(rawData);
      console.log('Parsed JSON:', jsonData);
  
      return jsonData;
    } catch (error) {
      console.error('Error reading JSON file:', error);
      throw error;
    }
  });
  


  ipcMain.handle('start-coe', async () => {
    if (coeProcess) {
      console.log('COE is already running.');
      return;
    }

    const coeJarPath = path.join(app.getAppPath(), 'resources', 'coe', 'coe.jar');

    if (!fs.existsSync(coeJarPath)) {
      console.error(`COE JAR not found at: ${coeJarPath}`);
      throw new Error('COE JAR not found.');
    }

    try {
      console.log('Starting COE with:', coeJarPath);
      coeProcess = spawn('java', ['-jar', coeJarPath], {
        detached: true,
        stdio: ['ignore', 'inherit', 'inherit'],
      });

      coeProcess.on('error', (err) => {
        console.error('Error spawning COE:', err.message);
      });

      coeProcess.on('close', (code) => {
        console.log(`COE process exited with code ${code}`);
        coeProcess = null;
      });
      
      coeProcess.unref();

      console.log('COE started in a separate terminal.');
    } catch (error) {
      console.error('Error starting COE:', error);
      throw error;
    }
  });

 ipcMain.handle('stop-coe', async () => {
  if (!coeProcess || coeProcess.pid === undefined) {
    console.log('COE is not running or PID is undefined');
    return;
  }

  try {
    console.log('Stopping COE with PID:', coeProcess.pid);
    kill(coeProcess.pid, 'SIGTERM', (err) => {
      if (err) {
        console.error('Error stopping COE:', err);
      } else {
        console.log('COE stopped successfully.');
        coeProcess = null;
      }
    });
  } catch (error) {
    console.error('Error stopping COE:', error);
    throw error;
  }
});