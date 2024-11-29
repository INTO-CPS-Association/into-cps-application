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
            label: 'Start Simulation',
            accelerator: process.platform === 'darwin' ? 'Cmd+F2' : 'Alt+F2',
            click: async () => {
              console.log('Start Simulation menu clicked');
              try {
                await ipcMain.emit('start-simulation');
              } catch (error) {
                console.error('Error starting simulation:', error);
              }
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

ipcMain.on('start-simulation', async () => {
  try {
    const coePath = path.join(app.getAppPath(), 'resources', 'cosimulation', '2018may7', 'coe.json');
    const mmPath = path.join(app.getAppPath(), 'resources', 'cosimulation', '2018may7', 'mm.json');

    console.log('Loading COE configuration from:', coePath);
    console.log('Loading Multi-model configuration from:', mmPath);

    const coeConfig = JSON.parse(fs.readFileSync(coePath, 'utf8'));
    const mmConfig = JSON.parse(fs.readFileSync(mmPath, 'utf8'));

    // Resolve FMU paths relative to mm.json
    const resolvedFmus = Object.fromEntries(
      Object.entries(mmConfig.fmus).map(([key, relativePath]) => [
        key,
        path.resolve(path.dirname(mmPath), relativePath as string),
      ])
    );

    coeConfig.connections = mmConfig.connections;
    coeConfig.parameters = mmConfig.parameters;
    coeConfig.fmus = resolvedFmus;

    console.log('Updated COE configuration with resolved FMU paths:', coeConfig);

    mainWindow?.webContents.send('simulation-status', 'Starting...');

    console.log('Sending /createSession request to COE...');
    const sessionResponse = await fetch('http://localhost:8082/createSession', {
      method: 'POST',
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      throw new Error(`Failed to create session: ${errorText}`);
    }

    const { sessionId } = await sessionResponse.json();
    console.log('Session created successfully. Session ID:', sessionId);

    console.log('Sending /initialize request to COE...');
    const initializeResponse = await fetch(`http://localhost:8082/initialize/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coeConfig),
    });

    if (!initializeResponse.ok) {
      const errorText = await initializeResponse.text();
      throw new Error(`Failed to initialize simulation: ${errorText}`);
    }

    console.log('Simulation initialized successfully.');

    console.log('Sending /simulate request to COE...');
    const simulateResponse = await fetch(`http://localhost:8082/simulate/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startTime: coeConfig.startTime, endTime: coeConfig.endTime }),
    });

    if (!simulateResponse.ok) {
      const errorText = await simulateResponse.text();
      throw new Error(`Failed to start simulation: ${errorText}`);
    }

    console.log('Simulation started successfully.');

    console.log('Fetching simulation results...');
    const resultResponse = await fetch(`http://localhost:8082/result/${sessionId}`);

    if (!resultResponse.ok) {
      const errorText = await resultResponse.text();
      throw new Error(`Failed to fetch results: ${errorText}`);
    }

    const resultData = await resultResponse.json();
    const resultPath = path.join(app.getAppPath(), 'resources', 'cosimulation', 'results', 'result.json');

    fs.writeFileSync(resultPath, JSON.stringify(resultData, null, 2));
    console.log('Simulation results saved to:', resultPath);

    mainWindow?.webContents.send('simulation-status', 'Simulation completed.');
  } catch (error) {
    console.error('Error during simulation:', error);
    mainWindow?.webContents.send('simulation-status', 'Simulation failed.');
  }
});