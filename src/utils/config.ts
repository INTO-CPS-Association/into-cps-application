import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { ConfigCoe } from '../../types/global';

dotenv.config();

const configFilePath = process.env.CONFIG_COE_PATH || path.resolve('./config.json');

if (!configFilePath || !fs.existsSync(configFilePath)) {
  console.error(`Config file not found at ${configFilePath}`);
  process.exit(1);
}

let configCoe:ConfigCoe;
try {
  const configData = fs.readFileSync(configFilePath, 'utf-8');
  configCoe = JSON.parse(configData);
  console.log('Loaded Config:', configCoe);
} catch (error) {
  console.error('Failed to load config file:', error);
  process.exit(1);
}

const outputPath = configCoe.outputPath;

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

export { configCoe };
