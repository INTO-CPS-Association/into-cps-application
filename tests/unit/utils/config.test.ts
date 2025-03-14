import * as path from 'path';
import * as fs from 'fs';
import { setProjectPath, getConfig } from '../../../src/utils/config';
import { ConfigMaestro } from '../../../src/types/global';

jest.mock('fs');

describe('Config Utils', () => {
  const mockProjectPath = '/mock/project/path';
  const expectedConfig: ConfigMaestro = {
    cosimulationPath: path.join(mockProjectPath, 'cosimulation'),
    defaultPath: path.join(mockProjectPath, 'cosimulation', 'default'),
    simulationConfigPath: path.join(mockProjectPath, 'cosimulation', 'default', 'experiment.json'),
    fmusPath: path.join(mockProjectPath, 'FMUs'),
    multiModels: path.join(mockProjectPath, 'cosimulation', 'default', 'multi-model.json'),
    outputPath: path.join(mockProjectPath, 'results', 'cosimulation', 'default'),
    maestroJarPath: path.resolve('src/utils/resources/maestro/maestro-webapi-3.0.0-bundle.jar'),
    tempMaestroJarPath: path.join('/tmp', 'maestro-webapi-3.0.0-bundle.jar'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set the project path and initialize the config', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.mkdirSync as jest.Mock).mockImplementation();

    setProjectPath(mockProjectPath);

    const config = getConfig();
    expect(config).toEqual(expectedConfig);
    expect(fs.existsSync).toHaveBeenCalledWith(expectedConfig.outputPath);
    expect(fs.mkdirSync).toHaveBeenCalledWith(expectedConfig.outputPath, { recursive: true });
  });

  it('should not create output directory if it already exists', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    setProjectPath(mockProjectPath);

    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });

  it('should copy simulationConfigPath and multiModels if they exist', () => {
    (fs.existsSync as jest.Mock).mockImplementation((filePath) =>
      [expectedConfig.simulationConfigPath, expectedConfig.multiModels].includes(filePath)
    );
    (fs.copyFileSync as jest.Mock).mockImplementation();

    setProjectPath(mockProjectPath);

    expect(fs.copyFileSync).toHaveBeenCalledWith(
      expectedConfig.simulationConfigPath,
      path.join(expectedConfig.outputPath, 'experiment.json')
    );
    expect(fs.copyFileSync).toHaveBeenCalledWith(
      expectedConfig.multiModels,
      path.join(expectedConfig.outputPath, 'multi-model.json')
    );
  });

  it('should not copy files if they do not exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.copyFileSync as jest.Mock).mockImplementation();

    setProjectPath(mockProjectPath);

    expect(fs.copyFileSync).not.toHaveBeenCalled();
  });

  it('should log an error if copying files fails', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.copyFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Copy failed');
    });

    setProjectPath(mockProjectPath);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[setProjectPath] Error copying configuration files to results folder:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  /* it('should return null if config has not been set', () => {
    expect(getConfig()).toBeNull();
  }); */
});