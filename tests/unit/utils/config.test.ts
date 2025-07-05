process.env.TERM = 'xterm';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as configModule from '../../../src/utils/config';
import { logError } from '../../../src/utils/logger';

jest.mock('fs');
jest.mock('os');
jest.mock('../../../src/utils/logger');
jest.mock('winston', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
  }),
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


jest.mock('../../../src/resources/maestro/maestro-version.json', () => ({
  version: '5.0.0',
}));

const mockProjectPath = '/mock/project';
const maestroVersion = '5.0.0';

describe('config.ts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (os.tmpdir as jest.Mock).mockReturnValue('/tmp');
    (fs.existsSync as jest.Mock).mockReturnValue(false);
  });

  it('should set project config correctly and create output folder', () => {
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});

    configModule.setProjectPath(mockProjectPath);

    const config = configModule.getConfig();

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      path.join(mockProjectPath, 'results', 'cosimulation', 'default'),
      { recursive: true }
    );

    expect(config).toMatchObject({
      cosimulationPath: path.join(mockProjectPath, 'cosimulation'),
      defaultPath: path.join(mockProjectPath, 'cosimulation', 'default'),
      simulationConfigPath: path.join(mockProjectPath, 'cosimulation', 'default', 'experiment.json'),
      fmusPath: path.join(mockProjectPath, 'FMUs'),
      multiModels: path.join(mockProjectPath, 'cosimulation', 'default', 'multi-model.json'),
      outputPath: path.join(mockProjectPath, 'results', 'cosimulation', 'default'),
      logDirectory: path.join(mockProjectPath, 'results', 'cosimulation', 'default', 'logs'),
      tempMaestroJarPath: path.join('/tmp', `maestro-${maestroVersion}-jar-with-dependencies.jar`),
    });
  });

  it('should copy config files if they exist', () => {
    (fs.existsSync as jest.Mock).mockImplementation((filePath) => {
      return filePath.includes('experiment.json') || filePath.includes('multi-model.json');
    });

    configModule.setProjectPath(mockProjectPath);

    expect(fs.copyFileSync).toHaveBeenCalledWith(
      expect.stringContaining('experiment.json'),
      expect.stringContaining('experiment.json')
    );
    expect(fs.copyFileSync).toHaveBeenCalledWith(
      expect.stringContaining('multi-model.json'),
      expect.stringContaining('multi-model.json')
    );
  });

  it('should log error if file copy fails', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.copyFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Copy failed');
    });

    configModule.setProjectPath(mockProjectPath);

    expect(logError).toHaveBeenCalledWith(expect.stringContaining('Error copying configuration files'));
  });

  it('getConfig should return null if not set', async () => {
    jest.resetModules();
    const freshConfigModule = await import('../../../src/utils/config');
    expect(freshConfigModule.getConfig()).toBe(null);
  });
  
});
