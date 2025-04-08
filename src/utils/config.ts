import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os'; 
import maestroConfig from '../resources/maestro/maestro-version.json';

const MAESTRO_VERSION = maestroConfig.version;

import { ConfigMaestro } from '../types/global';

let configMaestro: ConfigMaestro | null = null;

export function setProjectPath(projectPath: string): void {
  const cosimulationPath = path.join(projectPath, 'cosimulation');
  const defaultPath = path.join(cosimulationPath, 'default');
  const outputPath= path.join(projectPath, 'results', 'cosimulation', 'default');
  
  configMaestro = {
    cosimulationPath,
    defaultPath, 
    simulationConfigPath: path.join(defaultPath, 'experiment.json'),
    fmusPath: path.join(projectPath, 'FMUs'),
    multiModels: path.join(defaultPath, 'multi-model.json'),
    outputPath: outputPath,
    logDirectory: path.join(outputPath, 'logs'),
    maestroJarPath: path.resolve(__dirname, `resources/maestro/maestro-webapi-${MAESTRO_VERSION}-bundle.jar`),
    tempMaestroJarPath: path.join(os.tmpdir(), `maestro-webapi-${MAESTRO_VERSION}-bundle.jar`),
  };

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  try {
    const { simulationConfigPath, multiModels } = configMaestro;

    if (fs.existsSync(simulationConfigPath)) {
      fs.copyFileSync(simulationConfigPath, path.join(outputPath, 'experiment.json'));
    }

    if (fs.existsSync(multiModels)) {
      fs.copyFileSync(multiModels, path.join(outputPath, 'multi-model.json'));
    }
  } catch (error) {
    console.error('[Project Configuration] Error copying configuration files to results folder:', error);
  }
}


export function getConfig(): ConfigMaestro | null {
  return configMaestro;
}