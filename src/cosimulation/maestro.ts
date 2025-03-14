import * as path from 'path';
import * as fs from 'fs';
import kill from 'tree-kill';
import { spawn, ChildProcess } from 'child_process';
import { setSessionId } from './simulationContext';
import { pathToFileURL } from 'url';
import { isPortInUse, killProcessOnPort } from '../utils/processes/maestroUtils';
import { SimulationStatus, MaestroNotifications } from '../utils/constants/cosimulation/statuses';
import { handleError, sendNotification } from '../utils/errorHandler';
import { updateCosimulationMenu } from '../electron/gui/menu';
import { mainWindow } from '../main';
import { getConfig } from '../utils/config';
import { MaestroResponse } from '../types/global';

const MAESTRO_PORT = 8082;
const MAESTRO_BASE_URL = `http://localhost:${MAESTRO_PORT}`;

let maestroProcess: ChildProcess | null = null;
let isSimulationInProgress: boolean = false;

function extractMaestroJar() {
  const config = getConfig();
  if (!config) {
    sendNotification(MaestroNotifications.Error.ConfigurationNotSet, 'error');
    return { success: false, error: MaestroNotifications.Error.ConfigurationNotSet };
  }

  const { maestroJarPath, tempMaestroJarPath } = config;

  try {
    if (!fs.existsSync(maestroJarPath)) {
      sendNotification(`Maestro JAR not found at ${maestroJarPath}.`, 'error');
      return;
    }

    if (!fs.existsSync(tempMaestroJarPath)) {
      fs.copyFileSync(maestroJarPath, tempMaestroJarPath);
    }
  } catch (error) {
    handleError(error);
    return;
  }
}

async function startMaestro(): Promise<MaestroResponse> {
  const config = getConfig();
  if (!config) {
    sendNotification('Configuration not set. Please select a project.', 'error');
    return { success: false, error: MaestroNotifications.Error.ConfigurationNotSet };
  }

  const { tempMaestroJarPath } = config;

  try {
    await stopMaestro();

    const portInUse = await isPortInUse(MAESTRO_PORT);
    if (portInUse) {
      sendNotification(MaestroNotifications.Error.PortInUse(MAESTRO_PORT), 'error');
      await killProcessOnPort(MAESTRO_PORT);
    }

    extractMaestroJar();

    sendSimulationStatus(MaestroNotifications.Status.StartingMaestro);

    return new Promise((resolve, reject) => {
      maestroProcess = spawn('java', ['-jar', tempMaestroJarPath], {
        detached: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let serverReady = false;

      maestroProcess.stdout?.on('data', (data) => {
        const message = data.toString();
        console.log(`[Maestro STDOUT]: ${message}`);

        if (message.includes('Starting ProtocolHandler ["http-nio-8082"]')) {
          serverReady = true;
          sendSimulationStatus(MaestroNotifications.Status.MaestroStarted);
          if (mainWindow) {
            updateCosimulationMenu(mainWindow, true);
          }

          if (maestroProcess && mainWindow) {
            updateCosimulationMenu(mainWindow, true);
          }
          resolve({ success: true, message: MaestroNotifications.Status.MaestroStarted });
        }
      });

      maestroProcess.stderr?.on('data', (data) => {
        const errorOutput = data.toString();
        sendNotification(`[Maestro]: ${errorOutput}`, 'error')
        console.error(`[Maestro STDERR]: ${errorOutput}`);

        if (!serverReady) {
          const errorMessage = errorOutput.includes('java')
            ? MaestroNotifications.Error.JavaNotConfigured
            : MaestroNotifications.Error.GenericStartupError;
            sendNotification(errorMessage, 'error');
          reject({ success: false, error: errorMessage });
        }
      });

      maestroProcess.on('error', (error) => {
        handleError(error);
        if (!serverReady) reject({ success: false, error: error.message });
      });

      maestroProcess.on('close', (code) => {
        console.log(`[Maestro] Process exited with code: ${code}`);
        maestroProcess = null;
        if (mainWindow) {
          updateCosimulationMenu(mainWindow, false);
        }
        if (!serverReady) {
          sendNotification(MaestroNotifications.Status.MaestroStoppedBeforeReady, 'error');
          reject({ success: false, error:MaestroNotifications.Status.MaestroStoppedBeforeReady});
        }
      });

      maestroProcess.unref();
    });
  } catch (error) {
    handleError(error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function stopMaestro(): Promise<void> {
  try {
    if (!maestroProcess || maestroProcess.pid === undefined) {
      sendSimulationStatus(SimulationStatus.Idle);
      return;
    }

    const pid = maestroProcess.pid;
    return new Promise((resolve, reject) => {
      kill(pid, 'SIGTERM', (err) => {
        if (err) {
          handleError(err);
          reject(err);
        } else {
          maestroProcess = null;
          sendSimulationStatus(SimulationStatus.Idle);
          resolve();
        }
      });
    });
  } catch (error) {
    handleError(error);
  }
}

function sendSimulationStatus(status: string): void {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('simulation-status', status);
  }
}

async function startSimulation(): Promise<void> {
  try {
    if (isSimulationInProgress) {
      sendNotification('[Simulation] Simulation already in progress.', 'error');
      return;
    }

    isSimulationInProgress = true;
    const config = getConfig();
    
    if (!config) {
      sendNotification('Configuration not set. Please select a project.', 'error');
      isSimulationInProgress = false;
      return;
    }

    const { simulationConfigPath, multiModels, fmusPath } = config;


    sendSimulationStatus(SimulationStatus.StartingSimulation);

    if (!fs.existsSync(simulationConfigPath)) {
      sendNotification(`[Simulation] Missing file: ${simulationConfigPath}`, 'error');
      isSimulationInProgress = false;
      return;
    }
    if (!fs.existsSync(multiModels)) {
      sendNotification(`[Simulation] Missing file: ${multiModels}`, 'error');
      isSimulationInProgress = false;
      return;
    }

    const experimentConfig = JSON.parse(fs.readFileSync(simulationConfigPath, 'utf8'));
    const multiModelConfig = JSON.parse(fs.readFileSync(multiModels, 'utf8'));

    const resolvedFmus = Object.fromEntries(
      Object.entries(multiModelConfig.fmus)
        .filter(([_, relativePath]) => typeof relativePath === 'string' && relativePath.trim() !== '')
        .map(([key, relativePath]) => [
          key,
          pathToFileURL(path.resolve(fmusPath, relativePath as string)).toString(),
        ])
    );

    experimentConfig.connections = multiModelConfig.connections;
    experimentConfig.parameters = multiModelConfig.parameters;
    experimentConfig.fmus = resolvedFmus;

    const sessionResponse = await fetch(`${MAESTRO_BASE_URL}/createSession`, { method: 'GET' });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      sendNotification(`Failed to create session: ${errorText}`, 'error');
      isSimulationInProgress = false;
      return;
    }

    const { sessionId } = await sessionResponse.json();
    setSessionId(sessionId);

    const initializeResponse = await fetch(`${MAESTRO_BASE_URL}/initialize/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(experimentConfig),
    });

    if (!initializeResponse.ok) {
      const errorText = await initializeResponse.text();
      sendNotification(`Failed to initialize simulation: ${errorText}`, 'error');
      isSimulationInProgress = false;
      return;
    }

    sendSimulationStatus(SimulationStatus.Simulating);

    const simulateResponse = await fetch(`${MAESTRO_BASE_URL}/simulate/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startTime: experimentConfig.startTime, endTime: experimentConfig.endTime }),
    });

    if (!simulateResponse.ok) {
      const errorText = await simulateResponse.text();
      sendNotification(`Failed to start simulation: ${errorText}`, 'error');
      isSimulationInProgress = false;
      return;
    }

    sendSimulationStatus(SimulationStatus.SimulationCompleted);
  } catch (error) {
    const customMessage =
      error instanceof Error && error.message.includes('fetch failed')
        ? SimulationStatus.FetchFailed
        : error;

    handleError(customMessage);
    sendSimulationStatus(SimulationStatus.SimulationFailed + customMessage);
  } finally {
    isSimulationInProgress = false;
  }
}


async function getSimulationResult(sessionId: string): Promise<string> {

  try {
    const config = getConfig();
    if (!config) {
      sendNotification('Configuration not set. Please select a project.', 'error');
      return '';
    }

    const { outputPath } = config;

    const resultResponse = await fetch(`${MAESTRO_BASE_URL}/result/${sessionId}/plain`);
    if (!resultResponse.ok) {
      sendNotification(`Error fetching CSV results: ${resultResponse.statusText}`, 'error');
      return '';
    }

    const csvData = await resultResponse.text();
    const outputFile = path.join(outputPath, `simulation-${sessionId}.csv`);

    fs.writeFileSync(outputFile, csvData);
    return outputFile;
  } catch (error) {
    handleError(error);
    return '';
  }
}


export {
  startMaestro,
  stopMaestro,
  startSimulation,
  getSimulationResult,
};