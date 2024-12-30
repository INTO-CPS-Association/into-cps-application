import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { ConfigMaestro } from '../types/global';

dotenv.config();

const configFilePath = process.env.CONFIG_MAESTRO_PATH || path.resolve('./config.json');

if (!configFilePath || !fs.existsSync(configFilePath)) {
  console.error(`Config file not found at ${configFilePath}`);
  process.exit(1);
}

let configMaestro: ConfigMaestro;
try {
  const configData = fs.readFileSync(configFilePath, 'utf-8');
  configMaestro = JSON.parse(configData);
} catch (error) {
  console.error('Failed to load config file:', error);
  process.exit(1);
}

const outputPath = configMaestro.outputPath;

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

const maestroJarPath = path.resolve(__dirname, 'resources/maestro/maestro-webapi-3.0.0-bundle.jar');
const tempMaestroJarPath = path.join(process.env.TEMP || '/tmp', 'maestro-webapi-3.0.0-bundle.jar');

export { configMaestro, maestroJarPath, tempMaestroJarPath };