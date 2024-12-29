import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import { exec } from 'node:child_process';
import kill from 'tree-kill';
import { configMaestro } from '../../utils/config';
import { setSessionId } from '../../cosimulation/simulationContext';
import { pathToFileURL } from 'url';
import { ipcMain } from 'electron';

const { simulationConfigPath, fmusPath, multiModels, outputPath } = configMaestro;

let maestroProcess: ChildProcess | null = null;

const maestroJarPath = path.resolve(__dirname, 'resources/maestro/maestro.jar');
const tempMaestroJarPath = path.join(process.env.TEMP || '/tmp', 'maestro.jar');

function extractMaestroJar() {
  if (!fs.existsSync(maestroJarPath)) {
    console.error(`Maestro JAR not found at ${maestroJarPath}`);
    throw new Error(`Maestro JAR not found at ${maestroJarPath}`);
  }

  if (!fs.existsSync(tempMaestroJarPath)) {
    fs.copyFileSync(maestroJarPath, tempMaestroJarPath);
  } else {
    console.log(`Maestro JAR already extracted to ${tempMaestroJarPath}`);
  }
}

function checkJavaInstallation(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    exec('java -version', (error, stdout, stderr) => {
      if (error) {
        console.error('Error executing java -version:', stderr);
        reject(new Error('Java is not installed. Please install Java.'));
      } else {
        resolve(true);
      }
    });
  });
}

async function startMaestro(): Promise<void> {
  if (maestroProcess) {
    console.log('Maestro is already running.');
    return;
  }

  try {
    extractMaestroJar();
    await checkJavaInstallation();

    maestroProcess = spawn('java', ['-jar', tempMaestroJarPath], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    maestroProcess.stdout?.on('data', (data) => {
      console.log(`Maestro STDOUT: ${data.toString()}`);
    });

    maestroProcess.stderr?.on('data', (data) => {
      console.error(`Maestro STDERR: ${data.toString()}`);
    });

    maestroProcess.on('close', (code: number | null) => {
      console.log(`COE process exited with code ${code}`);
      maestroProcess = null;
    });

    maestroProcess.unref();
    console.log('Maestro started successfully.');
  } catch (error) {
    console.error('Error starting Maestro:', error);
    throw error;
  }
}

async function stopMaestro(): Promise<void> {
  if (!maestroProcess || maestroProcess.pid === undefined) {
    console.log('Maestro is not running.');
    return;
  }

  try {
    kill(maestroProcess.pid, 'SIGTERM', (err) => {
      if (err) {
        console.error('Error stopping COE:', err);
      } else {
        console.log('COE stopped successfully.');
        maestroProcess = null;
      }
    });
  } catch (error) {
    console.error('Error stopping COE:', error);
    throw error;
  }
}


function sendSimulationStatus(status: string): void {
  console.log("status in maestro manager: ", status)
  ipcMain.emit('simulation-status-update', null, status);
}


async function startSimulation(): Promise<void> {
  try {
    sendSimulationStatus('Starting simulation...');

    const maestroPath = path.join(simulationConfigPath, 'experiment.json');
    const mmPath = path.join(multiModels, 'multi-model.json');

    const maestroConfig = JSON.parse(fs.readFileSync(maestroPath, 'utf8'));
    const mmConfig = JSON.parse(fs.readFileSync(mmPath, 'utf8'));

    const resolvedFmus = Object.fromEntries(
      Object.entries(mmConfig.fmus)
        .filter(([_, relativePath]) => typeof relativePath === 'string' && relativePath.trim() !== '')
        .map(([key, relativePath]) => [
          key,
          pathToFileURL(path.resolve(fmusPath, relativePath as string)).toString(),
        ])
    );

    maestroConfig.connections = mmConfig.connections;
    maestroConfig.parameters = mmConfig.parameters;
    maestroConfig.fmus = resolvedFmus;

    console.log('Updated Maestro configuration:', maestroConfig);

    const sessionResponse = await fetch('http://localhost:8082/createSession', { method: 'GET' });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      throw new Error(`Failed to create session: ${errorText}`);
    }


    const { sessionId } = await sessionResponse.json();
    setSessionId(sessionId);
    console.log('Session created successfully. Session ID:', sessionId);

    const initializeResponse = await fetch(`http://localhost:8082/initialize/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(maestroConfig),
    });

    if (!initializeResponse.ok) {
      const errorText = await initializeResponse.text();
      throw new Error(`Failed to initialize simulation: ${errorText}`);
    }

    console.log('Simulation initialized successfully.');
    sendSimulationStatus('Running simulation...');

    const simulateResponse = await fetch(`http://localhost:8082/simulate/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startTime: maestroConfig.startTime, endTime: maestroConfig.endTime }),
    });

    if (!simulateResponse.ok) {
      const errorText = await simulateResponse.text();
      throw new Error(`Failed to start simulation: ${errorText}`);
    }

    console.log('Simulation started successfully.');
    sendSimulationStatus('Simulation completed.');

  } catch (error) {
    console.error('Error during simulation:', error);
    sendSimulationStatus(`Simulation failed: ${error}`);

    throw error;
  }
}

async function getSimulationResult(sessionId: string): Promise<string> {
  try {
    const resultResponse = await fetch(`http://localhost:8082/result/${sessionId}/plain`);
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
}

export {
  startMaestro,
  stopMaestro,
  startSimulation,
  getSimulationResult,
};
