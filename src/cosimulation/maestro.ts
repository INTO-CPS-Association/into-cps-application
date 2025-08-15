import * as path from 'path';
import * as fs from 'fs';
import { handleError, sendNotification } from '../utils/errorHandler';
import { getConfig } from '../utils/config';
import { SimulationStatus, SimulationStatusType } from '../utils/constants/cosimulation/statuses';
import { getJavaCommand, getReadableTimestamp } from '../utils/processes/maestroUtils';
import { setupSimulationLogger, logInfo, logError, logWarn } from '../utils/logger';
import { getExeca } from '../utils/execaWrapper';
import { ipcMain } from 'electron';

const execa = getExeca();
import { sendGraphWindowOpen } from '../electron/ipc/graphWindowHelper';

let simulationInProgress = false;

export type SimulationResult = {
  success: boolean;
  error?: string;
  status: SimulationStatusType;
};

// Helper function to update simulation status
function updateSimulationStatus(status: SimulationStatusType) {
  console.log('[Maestro] Updating simulation status to:', status);
  ipcMain.emit('simulation-status-update', null, status);
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

let graphWindowOpened = false;

async function startSimulation(): Promise<SimulationResult> {
  console.log('[Maestro] startSimulation called, simulationInProgress:', simulationInProgress);
  
  if (simulationInProgress) {
    const errorMsg = SimulationStatus.SimulationAlreadyInProgress;
    logWarn('Simulation already in progress.');
    sendNotification('[Simulation] Simulation already in progress.', 'warning');
    return { success: false, error: errorMsg, status: errorMsg };
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
      '-fsp', fmusPath,
    ];

    const javaExecutable = getJavaCommand();
    if (!javaExecutable) {
      const errorMsg = 'Java not configured or not found in PATH.';
      logError(errorMsg);
      throw new Error(errorMsg);
    }

    if (!graphWindowOpened) {
      sendGraphWindowOpen();
      graphWindowOpened = true;
    }
    
    updateSimulationStatus(SimulationStatus.Started);
    
    const subprocess = execa(javaExecutable, args, { all: true });

    const generatedGraphPath = path.join(simOutputDir, 'graph.html');

    fs.watchFile(generatedGraphPath, (curr) => {
      if (curr.size > 0) {
        try {
          fs.copyFileSync(generatedGraphPath, config.livePlotting);
          fs.unwatchFile(generatedGraphPath);
          sendGraphWindowOpen();
          updateSimulationStatus(SimulationStatus.Simulating);
        } catch (err) {
          sendNotification(`[Graph] Error copying graph.html: ${err}`, 'error');
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
    graphWindowOpened = false;

    if (exitCode === 0) {
      logInfo('Simulation completed successfully.');
      sendNotification('[Simulation] Completed successfully.', 'success');
      updateSimulationStatus(SimulationStatus.SimulationCompleted);
      
      setTimeout(() => {
        updateSimulationStatus(SimulationStatus.Idle);
      }, 3000);
      
      return { success: true, status: SimulationStatus.SimulationCompleted };
    } else {
      const errorMsg = `Simulation failed with exit code ${exitCode}`;
      logError(errorMsg);
      sendNotification(`[Simulation Error]: ${errorMsg}`, 'error');
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
    sendNotification(`[Simulation Error]: ${errMsg}`, 'error');
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