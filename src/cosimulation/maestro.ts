import * as path from 'path';
import * as fs from 'fs';
import kill from 'tree-kill';
import { spawn, ChildProcess } from 'child_process';
import { setSessionId } from './simulationContext';
import { pathToFileURL } from 'url';
import { isPortInUse, killProcessOnPort } from '../utils/processes/maestroUtils';
import { SimulationStatus, MaestroStatus } from '../utils/constants/cosimulation/statuses';
import { handleError } from '../utils/errorHandler';
import { updateCosimulationMenu } from '../electron/gui/menu';
import { mainWindow } from '../main';
import { getConfig } from '../utils/config';

const MAESTRO_PORT = 8082;
const MAESTRO_BASE_URL = `http://localhost:${MAESTRO_PORT}`;

let maestroProcess: ChildProcess | null = null;
let isSimulationInProgress = false;

function extractMaestroJar() {
  const config = getConfig();
  if (!config) {
    throw new Error('Configuration not set. Please select a project.');
  }

  const { maestroJarPath, tempMaestroJarPath } = config;

  try {
    if (!fs.existsSync(maestroJarPath)) {
      throw new Error(
        `Maestro JAR not found at ${maestroJarPath}. Ensure the file is in 'src/resources/maestro/'.`
      );
    }

    if (!fs.existsSync(tempMaestroJarPath)) {
      fs.copyFileSync(maestroJarPath, tempMaestroJarPath);
    }
  } catch (error) {
    handleError(error);
    throw error;
  }
}

async function startMaestro(): Promise<void> {
  const config = getConfig();
  if (!config) {
    throw new Error('Configuration not set. Please select a project.');
  }

  const { tempMaestroJarPath } = config;

  try {
    await stopMaestro();

    const portInUse = await isPortInUse(MAESTRO_PORT);
    if (portInUse) {
      console.warn(MaestroStatus.PortInUse(MAESTRO_PORT));
      await killProcessOnPort(MAESTRO_PORT);
    }

    if (maestroProcess && mainWindow) {
      updateCosimulationMenu(mainWindow, true);
      return;
    }

    extractMaestroJar();

    sendSimulationStatus(MaestroStatus.StartingMaestro);

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
          sendSimulationStatus(MaestroStatus.MaestroStarted);
          if (mainWindow) {
            updateCosimulationMenu(mainWindow, true);
          }
          resolve();
        }
      });

      maestroProcess.stderr?.on('data', (data) => {
        const errorOutput = data.toString();
        console.error(`[Maestro STDERR]: ${errorOutput}`);

        if (!serverReady) {
          const errorMessage = errorOutput.includes('java')
            ? MaestroStatus.JavaNotConfigured
            : MaestroStatus.GenericStartupError;
          handleError(new Error(errorMessage));
          reject(new Error(errorMessage));
        }
      });

      maestroProcess.on('error', (error) => {
        handleError(error);
        if (!serverReady) reject(error);
      });

      maestroProcess.on('close', (code) => {
        console.log(`[Maestro] Process exited with code: ${code}`);
        maestroProcess = null;
        if (mainWindow) {
          updateCosimulationMenu(mainWindow, false);
        }
        if (!serverReady) {
          handleError(new Error(MaestroStatus.MaestroStoppedBeforeReady));
          reject(new Error(MaestroStatus.MaestroStoppedBeforeReady));
        }
      });

      maestroProcess.unref();
    });
  } catch (error) {
    handleError(error);
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
  } else {
    console.error('[sendSimulationStatus] Main window not available.');
  }
}

async function startSimulation(): Promise<void> {
  try {
    const config = getConfig();
    if (!config) {
      throw new Error('Configuration not set. Please select a project.');
    }

    const { simulationConfigPath, multiModels, fmusPath } = config;

    if (isSimulationInProgress) {
      console.warn('[StartSimulation] Simulation already in progress.');
      return;
    }

    isSimulationInProgress = true;
    sendSimulationStatus(SimulationStatus.StartingSimulation);

    if (!fs.existsSync(simulationConfigPath)) {
      console.error('[StartSimulation] Missing file:', simulationConfigPath);
      throw new Error('experiment.json not found.');
    }
    if (!fs.existsSync(multiModels)) {
      console.error('[StartSimulation] Missing file:', multiModels);
      throw new Error('multi-model.json not found.');
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
      handleError(new Error(`Failed to create session: ${errorText}`));
      return;
    }

    const { sessionId } = await sessionResponse.json();
    setSessionId(sessionId);
    console.log('Session created successfully. Session ID:', sessionId);

    const initializeResponse = await fetch(`${MAESTRO_BASE_URL}/initialize/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(experimentConfig),
    });

    if (!initializeResponse.ok) {
      const errorText = await initializeResponse.text();
      handleError(new Error(`Failed to initialize simulation: ${errorText}`));
      return;
    }

    console.log('Simulation initialized successfully.');
    sendSimulationStatus(SimulationStatus.Simulating);

    const simulateResponse = await fetch(`${MAESTRO_BASE_URL}/simulate/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startTime: experimentConfig.startTime, endTime: experimentConfig.endTime }),
    });

    if (!simulateResponse.ok) {
      const errorText = await simulateResponse.text();
      handleError(new Error(`Failed to start simulation: ${errorText}`));
      return;
    }

    console.log('Simulation started successfully.');
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
      throw new Error('Configuration not set. Please select a project.');
    }

    const { outputPath } = config;

    const resultResponse = await fetch(`${MAESTRO_BASE_URL}/result/${sessionId}/plain`);
    if (!resultResponse.ok) {
      handleError(new Error(`Error fetching CSV results: ${resultResponse.statusText}`));
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