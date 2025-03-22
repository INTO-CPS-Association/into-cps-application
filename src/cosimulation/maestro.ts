import * as path from 'path';
import * as fs from 'fs';
import kill from 'tree-kill';
import { spawn, ChildProcess } from 'child_process';
import { setSessionId } from './simulationContext';
import { pathToFileURL } from 'url';
import {
  isPortInUse,
  killProcessOnPort,
} from '../utils/processes/maestroUtils';
import {
  SimulationStatus,
  MaestroNotifications,
} from '../utils/constants/cosimulation/statuses';
import { handleError, sendNotification } from '../utils/errorHandler';
import { updateCosimulationMenu } from '../electron/gui/menu';
import { mainWindow } from '../main';
import { getConfig } from '../utils/config';
import { MaestroResponse } from '../types/global';
import { getReadableTimestamp } from '../utils/processes/maestroUtils';

const MAESTRO_PORT = 8082;
const MAESTRO_BASE_URL = `http://localhost:${MAESTRO_PORT}`;

let maestroProcess: ChildProcess | null = null;
let isSimulationInProgress: boolean = false;

function initializeLoggingFile(
  type: 'maestro' | 'cosimulation',
): string | null {
  const config = getConfig();

  if (!config?.logDirectory) {
    sendNotification(MaestroNotifications.Error.ConfigurationNotSet, 'error');
    return null;
  }

  try {
    const { logDirectory } = config;

    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory, { recursive: true });
    }

    const filePath =
      type === 'maestro'
        ? path.join(logDirectory, 'Maestro.log')
        : path.join(logDirectory, `CoSimulation-${getReadableTimestamp()}.log`);

    fs.writeFileSync(filePath, '', { flag: 'w' });

    // this double checks immediately after creation
    try {
      fs.accessSync(filePath, fs.constants.W_OK);
    } catch (accessErr) {
      sendNotification(
        `[LogFile Warning]: ${type === 'maestro' ? 'Maestro' : 'Co-simulation'} log file is not writable. Logs may be incomplete.`,
        'error',
      );
    }
    return filePath;
  } catch (error) {
    sendNotification(
      `[LogFile Error]: Failed to prepare ${type} log file. Logs may not be saved.`,
      'error',
    );
    handleError(error);
    return null;
  }
}

function safeWrite(
  stream: fs.WriteStream | null,
  message: string,
  logType: 'maestro' | 'cosimulation',
) {
  if (!stream) return;
  const filePath = stream.path.toString();
  if (!fs.existsSync(filePath)) {
    sendNotification(
      `[LogFile Warning]: ${logType === 'maestro' ? 'Maestro' : 'Co-simulation'} log file was deleted during execution. Further logs will be lost unless restarted.`,
      'error',
    );
    return;
  }
  try {
    stream.write(message);
  } catch {
    sendNotification(
      `[LogFile Warning]: Unable to write to ${logType === 'maestro' ? 'Maestro' : 'Co-simulation'} log file. It may have been deleted or locked.`,
      'error',
    );
  }
}

function extractMaestroJar() {
  const config = getConfig();
  if (!config) {
    sendNotification(MaestroNotifications.Error.ConfigurationNotSet, 'error');
    return {
      success: false,
      error: MaestroNotifications.Error.ConfigurationNotSet,
    };
  }

  const { maestroJarPath, tempMaestroJarPath } = config;

  try {
    if (!fs.existsSync(maestroJarPath)) {
      sendNotification(`Maestro JAR not found at ${maestroJarPath}.`, 'error');
      return {
        success: false,
        error: `Maestro JAR not found at ${maestroJarPath}.`,
      };
    }

    if (!fs.existsSync(tempMaestroJarPath)) {
      fs.copyFileSync(maestroJarPath, tempMaestroJarPath);
    }
    return;
  } catch (error) {
    handleError(error);
    return;
  }
}

async function startMaestro(): Promise<MaestroResponse> {
  const config = getConfig();
  if (!config) {
    sendNotification(MaestroNotifications.Error.ConfigurationNotSet, 'error');
    return {
      success: false,
      error: MaestroNotifications.Error.ConfigurationNotSet,
    };
  }

  const { tempMaestroJarPath } = config;

  try {
    await stopMaestro();
    const maestroLogFile = initializeLoggingFile('maestro');
    if (!maestroLogFile) {
      return {
        success: false,
        error: 'Failed to initialize log file',
      };
    }
    const logStream = fs.createWriteStream(maestroLogFile, { flags: 'a' });

    const portInUse = await isPortInUse(MAESTRO_PORT);
    if (portInUse) {
      sendNotification(
        MaestroNotifications.Error.PortInUse(MAESTRO_PORT),
        'error',
      );
      await killProcessOnPort(MAESTRO_PORT);
    }

    extractMaestroJar();
    sendSimulationStatus(MaestroNotifications.Status.StartingMaestro);

    return new Promise((resolve, reject) => {
      maestroProcess = spawn('java', ['-jar', tempMaestroJarPath], {
        detached: false,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let serverReady = false;

      const stdoutHandler = (data: Buffer) => {
        const message = data.toString();
        console.log(`[Maestro STDOUT]: ${message}`);

        if (!serverReady) {
          safeWrite(logStream, `[STDOUT]: ${message}`, 'maestro');
        }

        if (message.includes('Starting ProtocolHandler ["http-nio-8082"]')) {
          serverReady = true;
          logStream.end();
          maestroProcess?.stdout?.off('data', stdoutHandler);
          maestroProcess?.stderr?.off('data', stderrHandler);

          sendSimulationStatus(MaestroNotifications.Status.MaestroStarted);
          if (mainWindow) {
            updateCosimulationMenu(mainWindow, true);
          }

          resolve({
            success: true,
            message: MaestroNotifications.Status.MaestroStarted,
          });
        }
      };

      const stderrHandler = (data: Buffer) => {
        const errorOutput = data.toString();
        console.error(`[Maestro STDERR]: ${errorOutput}`);
        if (!serverReady) {
          safeWrite(logStream, `[STDERR]: ${errorOutput}`, 'maestro');
        }

        if (!serverReady) {
          const errorMessage = errorOutput.includes('java')
            ? MaestroNotifications.Error.JavaNotConfigured
            : MaestroNotifications.Error.GenericStartupError;
          sendNotification(errorMessage, 'error');
          reject({ success: false, error: errorMessage });
        }
      };

      maestroProcess.stdout?.on('data', stdoutHandler);
      maestroProcess.stderr?.on('data', stderrHandler);

      maestroProcess.on('error', (error) => {
        handleError(error);
        safeWrite(logStream, `[ERROR]: ${error.message}\n`, 'maestro');
        if (!serverReady) reject({ success: false, error: error.message });
      });

      maestroProcess.on('close', (code) => {
        console.log(`[Maestro] Process exited with code: ${code}`);

        maestroProcess = null;
        if (mainWindow) {
          updateCosimulationMenu(mainWindow, false);
        }
        if (!serverReady) {
          sendNotification(
            MaestroNotifications.Status.MaestroStoppedBeforeReady,
            'error',
          );
          reject({
            success: false,
            error: MaestroNotifications.Status.MaestroStoppedBeforeReady,
          });
        }
      });

      maestroProcess.unref();
    });
  } catch (error) {
    handleError(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
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
  let simLogStream: fs.WriteStream | null = null;

  try {
    if (isSimulationInProgress) {
      sendNotification('[Simulation] Simulation already in progress.', 'error');
      return;
    }

    isSimulationInProgress = true;
    const config = getConfig();

    if (!config) {
      sendNotification(
        'Configuration not set. Please select a project.',
        'error',
      );
      isSimulationInProgress = false;
      return;
    }

    const { simulationConfigPath, multiModels, fmusPath } = config;

    sendSimulationStatus(SimulationStatus.StartingSimulation);

    const cosimLogFile = initializeLoggingFile('cosimulation');
    simLogStream = cosimLogFile
      ? fs.createWriteStream(cosimLogFile, { flags: 'a' })
      : null;
      safeWrite(simLogStream, `[INFO]: Starting simulation at ${new Date().toLocaleString()}\n`, 'cosimulation');

    if (!fs.existsSync(simulationConfigPath)) {
      const msg = `[Simulation] Missing file: ${simulationConfigPath}`;
      sendNotification(msg, 'error');
      safeWrite(simLogStream, `[ERROR]: ${msg}\n`, 'cosimulation');
      return;
    }

    if (!fs.existsSync(multiModels)) {
      const msg = `[Simulation] Missing file: ${multiModels}`;
      sendNotification(msg, 'error');
      safeWrite(simLogStream, `[ERROR]: ${msg}\n`, 'cosimulation');
      return;
    }

    const experimentConfig = JSON.parse(
      fs.readFileSync(simulationConfigPath, 'utf8'),
    );
    const multiModelConfig = JSON.parse(fs.readFileSync(multiModels, 'utf8'));

    const resolvedFmus = Object.fromEntries(
      Object.entries(multiModelConfig.fmus)
        .filter(
          ([_, relativePath]) =>
            typeof relativePath === 'string' && relativePath.trim() !== '',
        )
        .map(([key, relativePath]) => [
          key,
          pathToFileURL(
            path.resolve(fmusPath, relativePath as string),
          ).toString(),
        ]),
    );

    experimentConfig.connections = multiModelConfig.connections;
    experimentConfig.parameters = multiModelConfig.parameters;
    experimentConfig.fmus = resolvedFmus;

    safeWrite(simLogStream, '[INFO]: Configuration and FMUs resolved.\n', 'cosimulation');

    const sessionResponse = await fetch(`${MAESTRO_BASE_URL}/createSession`, {
      method: 'GET',
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      sendNotification(`Failed to create session: ${errorText}`, 'error');
      safeWrite(simLogStream,`[ERROR]: Failed to create session: ${errorText}\n`, 'cosimulation')
      return;
    }

    const { sessionId } = await sessionResponse.json();
    setSessionId(sessionId);
    safeWrite(simLogStream, `[INFO]: Session created: ${sessionId}\n`, 'cosimulation');

    if (maestroProcess) {
      maestroProcess.stdout?.on('data', (data) => {
        const message = data.toString();
        safeWrite(simLogStream, `[STDOUT]: ${message}`, 'cosimulation');
        // console.log(`[Maestro STDOUT]: ${message}`); //uncomment for debug
      });

      maestroProcess.stderr?.on('data', (data) => {
        const error = data.toString();
        safeWrite(simLogStream, `[STDERR]: ${error}`, 'cosimulation');
        // console.error(`[Maestro STDERR]: ${error}`); //uncomment for debug
      });
    }

    const initializeResponse = await fetch(
      `${MAESTRO_BASE_URL}/initialize/${sessionId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(experimentConfig),
      },
    );

    if (!initializeResponse.ok) {
      const errorText = await initializeResponse.text();
      sendNotification(
        `Failed to initialize simulation: ${errorText}`,
        'error',
      );
      safeWrite(simLogStream, `[ERROR]: Failed to initialize simulation: ${errorText}\n`, 'cosimulation');
      return;
    }

    safeWrite(simLogStream, '[INFO]: Simulation initialized.\n', 'cosimulation')
    sendSimulationStatus(SimulationStatus.Simulating);

    const simulateResponse = await fetch(
      `${MAESTRO_BASE_URL}/simulate/${sessionId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: experimentConfig.startTime,
          endTime: experimentConfig.endTime,
        }),
      },
    );

    if (!simulateResponse.ok) {
      const errorText = await simulateResponse.text();
      sendNotification(`Failed to start simulation: ${errorText}`, 'error');
      safeWrite(simLogStream, `[ERROR]: Failed to start simulation: ${errorText}\n`, 'cosimulation')
      return;
    }

    sendSimulationStatus(SimulationStatus.SimulationCompleted);
    safeWrite(simLogStream, '[INFO]: Simulation completed successfully.\n', 'cosimulation')
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes('fetch failed')
        ? SimulationStatus.FetchFailedSimulationError
        : String(error);

    handleError(message);
    sendSimulationStatus(SimulationStatus.SimulationFailed + message);
    safeWrite(simLogStream, `[ERROR]: ${message}\n`, 'cosimulation')
  } finally {
    safeWrite(simLogStream, `[INFO]: Simulation ended at ${new Date().toLocaleString()}\n`, 'cosimulation')
    simLogStream?.end();
    isSimulationInProgress = false;
  }
}

async function getSimulationResult(sessionId: string): Promise<string> {
  try {
    const config = getConfig();
    if (!config) {
      sendNotification(
        'Configuration not set. Please select a project.',
        'error',
      );
      return '';
    }

    const { outputPath } = config;

    const resultResponse = await fetch(
      `${MAESTRO_BASE_URL}/result/${sessionId}/plain`,
    );
    if (!resultResponse.ok) {
      sendNotification(
        `Error fetching CSV results: ${resultResponse.statusText}`,
        'error',
      );
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

export { startMaestro, stopMaestro, startSimulation, getSimulationResult };
