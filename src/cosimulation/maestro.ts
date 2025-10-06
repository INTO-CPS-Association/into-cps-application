import * as path from 'path';
import * as fs from 'fs';
import { BrowserWindow } from 'electron';
import { handleError, sendNotification } from '../utils/errorHandler';
import { getConfig } from '../utils/config';
import { SimulationStatus, SimulationStatusType } from '../utils/constants/cosimulation/statuses';
import { getJavaCommand, getReadableTimestamp } from '../utils/processes/maestroUtils';
import { setupSimulationLogger, logInfo, logError, logWarn } from '../utils/logger';
import { getExeca } from '../utils/execaWrapper';
import type { NotificationType } from '../types/global';

const execa = getExeca();
  
let simulationInProgress = false;

export type SimulationResult = {
  success: boolean;
  error?: string;
  status: SimulationStatusType;
};

// Helper function to update simulation status
function updateSimulationStatus(status: SimulationStatusType) {
  console.log('[Maestro] Updating simulation status to:', status);
  const allWindows = BrowserWindow.getAllWindows();
  allWindows.forEach(win => {
    win.webContents.send('simulation-status', status);
  });
}

export function __setSimulationInProgress(value: boolean) {
  simulationInProgress = value;
  if (value) {
    updateSimulationStatus(SimulationStatus.StartingSimulation);
  } else {
    updateSimulationStatus(SimulationStatus.Idle);
  }
}

export function extractMaestroJar(maestroJarPath: string, tempMaestroJarPath: string): void {
  if (!fs.existsSync(maestroJarPath)) {
    const errorMsg = `Maestro JAR not found at ${maestroJarPath}.`;
    logError(errorMsg);
    throw new Error(errorMsg);
  }

  if (!fs.existsSync(tempMaestroJarPath)) {
    try {
      fs.copyFileSync(maestroJarPath, tempMaestroJarPath);
      logInfo(`Copied Maestro JAR to temp path: ${tempMaestroJarPath}`);
    } catch {
      const errorMsg = 'Failed to copy Maestro JAR to temp path.';
      logError(errorMsg);
      throw new Error(errorMsg);
    }
  }
}

function getLatestSimulationFolder(): string | null {
  const config = getConfig();
  if (!config) return null;

  const baseDir = config.outputPath;
  if (!fs.existsSync(baseDir)) return null;

  const folders = fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('CoSimulation-'))
    .map((entry) => {
      const fullPath = path.join(baseDir, entry.name);
      return {
        name: entry.name,
        fullPath,
        timestamp: fs.statSync(fullPath).mtime.getTime(),
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  return folders[0]?.fullPath || null;
}

export { getLatestSimulationFolder };


async function startSimulation(): Promise<SimulationResult> {
  if (simulationInProgress) {
    logWarn(SimulationStatus.SimulationAlreadyInProgress);
    sendNotification('[Simulation]' + SimulationStatus.SimulationAlreadyInProgress, 'error' as NotificationType);
    return { success: false, error: SimulationStatus.SimulationAlreadyInProgress, status: SimulationStatus.SimulationAlreadyInProgress };
  }

  simulationInProgress = true;
  updateSimulationStatus(SimulationStatus.StartingSimulation);
  let simLogStream: fs.WriteStream | null = null;

  try {
    const config = getConfig();
    if (!config) {
      const errorMsg = 'Configuration not set. Please select a project.';
      logError(errorMsg);
      throw new Error(errorMsg);
    }

    const { simulationConfigPath, multiModels, fmusPath, maestroJarPath, tempMaestroJarPath, outputPath } = config;
    updateSimulationStatus(SimulationStatus.StartingSimulation);

    extractMaestroJar(maestroJarPath, tempMaestroJarPath);

    const timestamp = getReadableTimestamp().replace(/[: ]/g, '-');
    const simFolderName = `CoSimulation-${timestamp}`;
    const simOutputDir = path.join(outputPath, simFolderName);

    fs.mkdirSync(simOutputDir, { recursive: true });

    const logFile = path.join(simOutputDir, `cosimulation-${timestamp}.log`);
    fs.writeFileSync(logFile, '', { flag: 'w' });
    simLogStream = fs.createWriteStream(logFile, { flags: 'a' });

    setupSimulationLogger(logFile);
    logInfo(`Starting simulation at ${new Date().toLocaleString()}`);
    simLogStream.write(`[INFO]: Starting simulation at ${new Date().toLocaleString()}\n`);

    const args = [
      '-jar', tempMaestroJarPath,
      'import', 'sg1',
      multiModels,
      simulationConfigPath,
      '-output', simOutputDir,
      '--dump-intermediate',
      '--interpret',
      '--websocket', '8085',
      '-fsp', fmusPath
    ];

    const javaExecutable = getJavaCommand();
    if (!javaExecutable) {
      const errorMsg = 'Java not configured or not found in PATH.';
      logError(errorMsg);
      throw new Error(errorMsg);
    }

    const subprocess = execa(javaExecutable, args, { all: true });

    const generatedGraphPath = path.join(simOutputDir, 'graph.html');

    fs.watchFile(generatedGraphPath, (curr) => {
      if (curr.size > 0) {
        try {
          fs.copyFileSync(generatedGraphPath, config.livePlotting);
          fs.unwatchFile(generatedGraphPath);
        } catch (err) {
          sendNotification(`[Graph] Error copying graph.html: ${err}`, 'error' as NotificationType);
        }
      }
    });

    let hasStartedSimulating = false;


    subprocess.all?.on('data', (chunk: Buffer) => {
      const msg = chunk.toString();

      if (!hasStartedSimulating && (msg.includes('Starting simulation') || msg.includes('Running simulation'))) {
        updateSimulationStatus(SimulationStatus.Simulating);
        hasStartedSimulating = true;
      }

      if (msg.includes('ERROR') || msg.includes('Error')) {
        logError(`[CLI STDERR]: ${msg.trim()}`);
      } else {
        logInfo(`[CLI STDOUT]: ${msg.trim()}`);
      }
      simLogStream?.write(msg);
    });

    const { exitCode } = await subprocess;

    simLogStream?.write(`[INFO]: Simulation ended with code ${exitCode}\n`);
    simLogStream?.end();

    const outputsDir = path.join(simOutputDir, 'outputs');
    const renamedOutputsDir = path.join(simOutputDir, `outputs-${timestamp}`);
    if (fs.existsSync(outputsDir)) {
      fs.renameSync(outputsDir, renamedOutputsDir);
      logInfo('Outputs folder renamed successfully.');
    }

    simulationInProgress = false;

    if (exitCode === 0) {
      logInfo('Simulation completed successfully.');
      sendNotification('[Simulation]: ' + SimulationStatus.SimulationCompleted, 'success' as NotificationType);
      updateSimulationStatus(SimulationStatus.SimulationCompleted);
      return { success: true, status: SimulationStatus.SimulationCompleted };
    } else {
      const errorMsg = `Simulation failed with exit code ${exitCode}`;
      logError(errorMsg);
      sendNotification(`[Simulation Error]: ${errorMsg}`, 'error' as NotificationType);
      updateSimulationStatus(SimulationStatus.SimulationFailed);

      setTimeout(() => {
        updateSimulationStatus(SimulationStatus.Idle);
      }, 3000);

      return { success: false, error: errorMsg, status: SimulationStatus.SimulationFailed };
    }

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    handleError(error);
    logError(`Simulation caught exception: ${errMsg}`);
    sendNotification(`[Simulation Error]: ${errMsg}`, 'error' as NotificationType);
    simulationInProgress = false;
    simLogStream?.end();

    updateSimulationStatus(SimulationStatus.SimulationFailed);

    setTimeout(() => {
      updateSimulationStatus(SimulationStatus.Idle);
    }, 3000);


    return { success: false, error: errMsg, status: SimulationStatus.SimulationFailed };
  }
}

export { startSimulation };