import fs from 'fs';
import { execa } from 'execa';
import * as config from '../../../src/utils/config';
import * as errorHandler from '../../../src/utils/errorHandler';
import * as logger from '../../../src/utils/logger';
import * as utils from '../../../src/utils/processes/maestroUtils';
import { SimulationStatus } from '../../../src/utils/constants/cosimulation/statuses';

jest.mock('fs');
jest.mock('execa', () => ({
  __esModule: true,
  execa: jest.fn(),
}));

const mockedExeca = execa as unknown as jest.Mock;

const mockWriteStream = {
  write: jest.fn(),
  end: jest.fn(),
};

describe('maestro.ts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'copyFileSync').mockImplementation(() => {});
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => 'mocked-path');
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    jest.spyOn(fs, 'createWriteStream').mockReturnValue(mockWriteStream as any);

    jest.spyOn(config, 'getConfig').mockReturnValue({
      simulationConfigPath: 'sim.conf',
      multiModels: 'multi.json',
      fmusPath: 'fmus/',
      maestroJarPath: 'maestro.jar',
      tempMaestroJarPath: 'temp/maestro.jar',
      outputPath: 'output',
      cosimulationPath: 'cosim/',
      defaultPath: 'default/',
      logDirectory: 'logs/',
    });

    jest.spyOn(utils, 'getJavaCommand').mockReturnValue('java');
    jest.spyOn(logger, 'setupSimulationLogger').mockImplementation(() => {});
    jest.spyOn(logger, 'logInfo').mockImplementation(() => {});
    jest.spyOn(logger, 'logError').mockImplementation(() => {});
    jest.spyOn(logger, 'logWarn').mockImplementation(() => {});
    jest.spyOn(errorHandler, 'handleError').mockImplementation(() => {});
    jest.spyOn(errorHandler, 'sendNotification').mockImplementation(() => {});
  });

  it('should start simulation successfully', async () => {
    mockedExeca.mockResolvedValue({
      all: { on: jest.fn() },
      exitCode: 0,
    });

    const { startSimulation } = await import('../../../src/cosimulation/maestro');
    const result = await startSimulation();

    expect(fs.copyFileSync).toHaveBeenCalled();
    expect(fs.mkdirSync).toHaveBeenCalled();
    expect(mockWriteStream.write).toHaveBeenCalled();
    expect(logger.logInfo).toHaveBeenCalledWith(expect.stringContaining('Simulation completed successfully.'));
    expect(errorHandler.sendNotification).toHaveBeenCalledWith('[Simulation] Completed successfully.', 'success');
    expect(result).toEqual({
      success: true,
      status: SimulationStatus.SimulationCompleted,
    });
  });

  it('should handle error when java not found', async () => {
    jest.spyOn(utils, 'getJavaCommand').mockReturnValue(null as unknown as string);

    const { startSimulation } = await import('../../../src/cosimulation/maestro');
    const result = await startSimulation();

    expect(result.success).toBe(false);
    expect(result.status).toBe(SimulationStatus.SimulationFailed);
    expect(errorHandler.sendNotification).toHaveBeenCalledWith(expect.stringContaining('Java not configured'), 'error');
  });

  it('should return error if config is missing', async () => {
    jest.spyOn(config, 'getConfig').mockReturnValue(null);

    const { startSimulation } = await import('../../../src/cosimulation/maestro');
    const result = await startSimulation();

    expect(result.success).toBe(false);
    expect(result.status).toBe(SimulationStatus.SimulationFailed);
    expect(errorHandler.sendNotification).toHaveBeenCalledWith(expect.stringContaining('Configuration not set'), 'error');
  });

  it('should detect simulation already in progress (without direct set)', async () => {
    const { startSimulation } = await import('../../../src/cosimulation/maestro');

    jest.spyOn(utils, 'getJavaCommand').mockImplementation(() => { throw new Error('dummy'); });
    await startSimulation(); // fails and resets the flag

    const result = await startSimulation();

    expect(result.success).toBe(false);
    expect(result.status).toBe(SimulationStatus.SimulationFailed);
  });
});
