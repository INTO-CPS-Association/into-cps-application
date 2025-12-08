import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import maestroConfig from '../resources/maestro/maestro-version.json';

const MAESTRO_VERSION = maestroConfig.version;

import { ConfigMaestro } from '../types/global';
import { logError } from './logger';

let configMaestro: ConfigMaestro | null = null;

export function setProjectPath(projectPath: string): void {
  const cosimulationPath = path.join(projectPath, 'cosimulation');
  const defaultPath = path.join(cosimulationPath, 'default');
  const fmusPath = path.join(projectPath, 'FMUs');
  const outputPath = path.join(projectPath, 'results', 'cosimulation', 'default');
  const livePlotting = path.join(outputPath, 'graph.html');

  configMaestro = {
    cosimulationPath,
    defaultPath,
    livePlotting,
    simulationConfigPath: path.join(defaultPath, 'experiment.json'),
    fmusPath,
    multiModels: path.join(defaultPath, 'multi-model.json'),
    outputPath,
    logDirectory: path.join(outputPath, 'logs'),
    maestroJarPath: path.resolve(__dirname, `resources/maestro/maestro-${MAESTRO_VERSION}-jar-with-dependencies.jar`),
    tempMaestroJarPath: path.join(os.tmpdir(), `maestro-${MAESTRO_VERSION}-jar-with-dependencies.jar`),
  };

  [cosimulationPath, defaultPath, fmusPath, outputPath].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  try {
    const { simulationConfigPath, multiModels } = configMaestro;

    if (fs.existsSync(simulationConfigPath)) {
      fs.copyFileSync(simulationConfigPath, path.join(outputPath, 'experiment.json'));
    }

    if (fs.existsSync(multiModels)) {
      fs.copyFileSync(multiModels, path.join(outputPath, 'multi-model.json'));
    }
  } catch (error) {
    logError(`[Project Configuration] Error copying configuration files to results folder: ${error}`);
    throw new Error(`Failed to copy configuration files: ${error}`);
  }
}

export function getConfig(): ConfigMaestro | null {
  return configMaestro;
}