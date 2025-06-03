import { logInfo, setupSimulationLogger } from '../../../src/utils/logger';
import fs from 'fs';
import path from 'path';
import * as winston from 'winston';

jest.mock('fs');
jest.mock('winston', () => {
  const mLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
  return {
    createLogger: jest.fn(() => mLogger),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      printf: jest.fn(),
    },
    transports: {
      File: jest.fn(),
      Console: jest.fn(),
    },
  };
});

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.mkdirSync as jest.Mock).mockImplementation();
  });

  it('should set up logger with file', () => {
    logInfo('This is a test log');
  });

  it('should fallback to console if logger is not set', async () => {
    jest.resetModules();

    const consoleInfo = jest.spyOn(console, 'info').mockImplementation(() => {});
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    jest.doMock('winston', () => ({
      createLogger: () => null,
      format: {
        combine: jest.fn(),
        timestamp: jest.fn(),
        printf: jest.fn(),
      },
      transports: {
        Console: jest.fn(),
        File: jest.fn(),
      },
    }));

    const logger = await import('../../../src/utils/logger');

    logger.logInfo('info test');
    logger.logError('error test');
    logger.logWarn('warn test');

    expect(consoleInfo).toHaveBeenCalledWith('[INFO]: info test');
    expect(consoleError).toHaveBeenCalledWith('[ERROR]: error test');
    expect(consoleWarn).toHaveBeenCalledWith('[WARN]: warn test');

    consoleInfo.mockRestore();
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  it('should create log directory and configure logger correctly', () => {
    const loggingFile = '/mock/logs/app.log';
    const logDir = path.dirname(loggingFile);

    (fs.existsSync as jest.Mock).mockImplementation((p) => p !== logDir);
    const mkdirSpy = jest.spyOn(fs, 'mkdirSync');
    const loggerSpy = jest.spyOn(winston, 'createLogger');

    setupSimulationLogger(loggingFile);

    expect(fs.existsSync).toHaveBeenCalledWith(logDir);
    expect(mkdirSpy).toHaveBeenCalledWith(logDir, { recursive: true });
    expect(loggerSpy).toHaveBeenCalled();
  });
});
