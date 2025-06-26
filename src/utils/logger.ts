import { createLogger, format, transports } from 'winston';
import * as path from 'path';
import * as fs from 'fs';

let simulationLogger: ReturnType<typeof createLogger> | null = null;

/**
 * Logger setup on specific file
 */
export function setupSimulationLogger(loggingFile: string) {
  const dir = path.dirname(loggingFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  simulationLogger = createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level.toUpperCase()}]: ${message}`)
    ),
    transports: [
      new transports.File({ filename: loggingFile }),
      new transports.Console()
    ],
  });
}

/**
 * Info messages
 */
export function logInfo(message: string) {
  if (simulationLogger) {
    simulationLogger.info(message);
  } else {
    console.info(`[INFO]: ${message}`);
  }
}

/**
 * Error messages
 */
export function logError(message: string) {
  if (simulationLogger) {
    simulationLogger.error(message);
  } else {
    console.error(`[ERROR]: ${message}`);
  }
}

/**
 * Warning messages
 */
export function logWarn(message: string) {
  if (simulationLogger) {
    simulationLogger.warn(message);
  } else {
    console.warn(`[WARN]: ${message}`);
  }
}
