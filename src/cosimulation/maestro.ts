import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { handleError, sendNotification } from '../utils/errorHandler';
import { getConfig } from '../utils/config';
import { SimulationStatus } from '../utils/constants/cosimulation/statuses';
import { getReadableTimestamp } from '../utils/processes/maestroUtils';

let isSimulationInProgress = false;

function sendSimulationStatus(status: string): void {
  const { mainWindow } = require('../main');
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('simulation-status', status);
  }
}

function safeWrite(stream: fs.WriteStream | null, message: string) {
  if (!stream) return;
  try {
    stream.write(message);
  } catch (err) {
    sendNotification('[LogFile Error]: Failed to write to log file.', 'error');
  }
}

function extractMaestroJar(maestroJarPath: string, tempMaestroJarPath: string): boolean {
  try {
    if (!fs.existsSync(maestroJarPath)) {
      sendNotification(`[Simulation Error]: Maestro JAR not found at ${maestroJarPath}`, 'error');
      return false;
    }

    if (!fs.existsSync(tempMaestroJarPath)) {
      fs.copyFileSync(maestroJarPath, tempMaestroJarPath);
      console.log(`[INFO]: Copied Maestro JAR to temp path: ${tempMaestroJarPath}`);
    }

    return true;
  } catch (err) {
    handleError(err);
    sendNotification('[Simulation Error]: Failed to extract Maestro JAR.', 'error');
    return false;
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


async function startSimulation(): Promise<{ success: boolean; error?: string }> {
  if (isSimulationInProgress) {
    sendNotification('[Simulation] Simulation already in progress.', 'error');
    return { success: false, error: SimulationStatus.SimulationAlreadyInProgress };
  }

  isSimulationInProgress = true;

  let simLogStream: fs.WriteStream | null = null;
  let simProcess: ReturnType<typeof spawn> | null = null;

  try {
    const config = getConfig();
    if (!config) {
      sendNotification('Configuration not set. Please select a project.', 'error');
      isSimulationInProgress = false;
      return { success: false, error: 'Configuration not set' };
    }

    const {
      simulationConfigPath,
      multiModels,
      fmusPath,
      maestroJarPath,
      tempMaestroJarPath,
      outputPath
    } = config;

    const jarReady = extractMaestroJar(maestroJarPath, tempMaestroJarPath);
    if (!jarReady) {
      isSimulationInProgress = false;
      return { success: false, error: 'Maestro JAR not found or copy failed' };
    }

    const timestamp = getReadableTimestamp().replace(/[: ]/g, '-');
    const simFolderName = `CoSimulation-${timestamp}`;
    const simOutputDir = path.join(outputPath, simFolderName);

    fs.mkdirSync(simOutputDir, { recursive: true });

    const logFile = path.join(simOutputDir, `cosimulation-${timestamp}.log`);
    fs.writeFileSync(logFile, '', { flag: 'w' });
    simLogStream = fs.createWriteStream(logFile, { flags: 'a' });

    safeWrite(simLogStream, `[INFO]: Starting simulation at ${new Date().toLocaleString()}\n`);
    sendSimulationStatus(SimulationStatus.StartingSimulation);

    const args = [
      '-jar', tempMaestroJarPath,
      'import', 'sg1',
      multiModels,
      simulationConfigPath,
      '-output', simOutputDir,
      '--dump-intermediate',
      '--interpret',
      '-fsp', fmusPath
    ];

    const javaExecutable = require('../utils/processes/maestroUtils').getJavaCommand();
    if (!javaExecutable) {
      sendNotification('Java not configured or not found in PATH.', 'error');
      isSimulationInProgress = false;
      return { success: false, error: 'Java not found' };
    }

    simProcess = spawn(javaExecutable, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    simProcess.stdout?.on('data', (data) => {
      const msg = data.toString();
      console.log(`[CLI STDOUT]: ${msg}`);
      safeWrite(simLogStream, `[STDOUT]: ${msg}`);
    });

    simProcess.stderr?.on('data', (data) => {
      const msg = data.toString();
      console.error(`[CLI STDERR]: ${msg}`);
      safeWrite(simLogStream, `[STDERR]: ${msg}`);
    });

    simProcess.on('close', (code) => {
      safeWrite(simLogStream, `[INFO]: Simulation ended with code ${code}\n`);
      simLogStream?.end();

      const outputsDir = path.join(simOutputDir, 'outputs');
      const renamedOutputsDir = path.join(simOutputDir, `outputs-${timestamp}`);
      if (fs.existsSync(outputsDir)) {
        fs.renameSync(outputsDir, renamedOutputsDir);
      }

      if (code === 0) {
        sendSimulationStatus(SimulationStatus.SimulationCompleted);
        sendNotification('[Simulation] Completed successfully.', 'success');
      } else {
        sendSimulationStatus(SimulationStatus.SimulationFailed);
        sendNotification(`[Simulation Error]: Process exited with code ${code}`, 'error');
      }

      isSimulationInProgress = false;
    });

    simProcess.on('error', (err) => {
      const errorMsg = `[ERROR]: ${err.message}`;
      handleError(err);
      safeWrite(simLogStream, errorMsg + '\n');
      sendNotification('[Simulation Error]: Failed to launch process.', 'error');
      sendSimulationStatus(SimulationStatus.SimulationFailed);
      isSimulationInProgress = false;
      simLogStream?.end();
    });

    return { success: true };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    handleError(error);
    safeWrite(simLogStream, `[CATCH ERROR]: ${errMsg}\n`);
    sendSimulationStatus(SimulationStatus.SimulationFailed);
    isSimulationInProgress = false;
    simLogStream?.end();
    return { success: false, error: errMsg };
  }
}

export { startSimulation };