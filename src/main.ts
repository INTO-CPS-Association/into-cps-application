import { app, BrowserWindow, ipcMain } from 'electron';
import { createTopMenu } from './main/menu';
import { pathToFileURL } from 'url';
import { spawn, ChildProcess } from 'child_process';
import { configCoe } from './utils/config';
import { setSessionId, getSessionId } from './cosimulation/simulationContext';

import * as path from 'path';
import * as fs from 'fs';
import kill from 'tree-kill';

let mainWindow: BrowserWindow | null = null;
let coeProcess: ChildProcess | null = null;

const { coeJarPath, simulationConfigPath, fmusPath, multiModels, outputPath } = configCoe;

if (!coeJarPath || !simulationConfigPath || !fmusPath || !multiModels || !outputPath) {
  console.error('Missing required paths in config.json');
  process.exit(1);
}

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

  console.log(`Starting Electron in ${isDev ? 'development' : 'production'} mode`);
  console.log(`Loading URL: ${startUrl}`);

  mainWindow.loadURL(startUrl).catch((error) => {
    console.error('Failed to load URL:', error);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();
  createTopMenu(mainWindow);
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

ipcMain.handle('get-config', () => {
  console.log('Sending config to renderer:', configCoe);
  return configCoe;
});

ipcMain.handle('read-json-file', async (event, relativePath) => {
  try {
    const fullPath = path.isAbsolute(relativePath)
      ? relativePath
      : path.join(multiModels, relativePath);

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

ipcMain.handle('start-coe', async (event) => {
  event.sender.send('coe-reset');

  if (coeProcess) {
    console.log('COE is already running.');
    return;
  }

  if (!fs.existsSync(coeJarPath)) {
    const errorMessage = `COE JAR not found at: ${coeJarPath}`;
    console.error(errorMessage);
    event.sender.send('coe-error', errorMessage);
    throw new Error(errorMessage);
  }

  try {
    console.log('Starting COE with:', coeJarPath);
    coeProcess = spawn('java', ['-jar', coeJarPath], {
      detached: true,
      stdio: ['ignore', 'inherit', 'inherit'],
    });

    coeProcess.on('error', (err) => {
      const errorMessage = `Error spawning COE: ${err.message}`;
      console.error(errorMessage);
      event.sender.send('coe-error', errorMessage);
    });

    coeProcess.on('close', (code) => {
      const message = `COE process exited with code ${code}`;
      console.log(message);
      coeProcess = null;
      if (code !== 0) {
        event.sender.send('coe-error', message);
      }
    });

    coeProcess.unref();
    console.log('COE started in a separate terminal.');
  } catch (error) {
    const errorMessage = `Error starting COE: ${error}`;
    console.error(errorMessage);
    event.sender.send('coe-error', errorMessage);
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
    mainWindow?.webContents.send('simulation-status', 'Starting simulation...');

    const coePath = path.join(simulationConfigPath, 'coe.json');
    const mmPath = path.join(multiModels, 'mm.json');

    const coeConfig = JSON.parse(fs.readFileSync(coePath, 'utf8'));
    const mmConfig = JSON.parse(fs.readFileSync(mmPath, 'utf8'));

    const resolvedFmus = Object.fromEntries(
      Object.entries(mmConfig.fmus)
        .filter(([_, relativePath]) => typeof relativePath === 'string' && relativePath.trim() !== '')
        .map(([key, relativePath]) => [
          key,
          pathToFileURL(path.resolve(fmusPath, relativePath as string)).toString(),
        ])
    );

    coeConfig.connections = mmConfig.connections;
    coeConfig.parameters = mmConfig.parameters;
    coeConfig.fmus = resolvedFmus;

    console.log('Updated COE configuration:', coeConfig);

    mainWindow?.webContents.send('simulation-status', 'Creating session...');
    const sessionResponse = await fetch('http://localhost:8082/createSession', {
      method: 'POST',
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      throw new Error(`Failed to create session: ${errorText}`);
    }

    const { sessionId } = await sessionResponse.json();
    setSessionId(sessionId);
    console.log('Session created successfully. Session ID:', sessionId);

    mainWindow?.webContents.send('simulation-status', 'Initializing simulation...');
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

    mainWindow?.webContents.send('simulation-status', 'Running simulation...');
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

    mainWindow?.webContents.send('simulation-status', 'Simulation completed.');
  } catch (error) {
    console.error('Error during simulation:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    mainWindow?.webContents.send('simulation-status', `Simulation failed: ${errorMessage}`);
  }
});

ipcMain.handle('get-session-id', () => {
  const sessionId = getSessionId();
  console.log('Returning session ID:', sessionId);
  return sessionId || null;
});

ipcMain.handle('get-simulation-result', async (event, sessionId: string) => {
  try {
    const resultResponse = await fetch(`http://localhost:8082/result/${sessionId}/csv`);
    if (!resultResponse.ok) {
      throw new Error(`Error fetching CSV results: ${resultResponse.statusText}`);
    }

    const csvData = await resultResponse.text();
    const outputFile = path.join(outputPath, `simulation-${sessionId}.csv`);

    fs.writeFileSync(outputFile, csvData);
    console.log(`Simulation CSV results saved to: ${outputFile}`);

    return outputFile;
  } catch (error) {
    console.error('Error fetching CSV results:', error);
    throw error;
  }
});