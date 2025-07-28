const execaMock = jest.fn();
import fs from 'fs';
import path from 'path';
import { SimulationStatus } from '../../../src/utils/constants/cosimulation/statuses';
import * as configModule from '../../../src/utils/config';

jest.mock('fs');
jest.mock('path');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/errorHandler');
jest.mock('../../../src/utils/execaWrapper', () => ({
  getExeca: () => execaMock,
}));
jest.mock('../../../src/utils/processes/maestroUtils', () => ({
  getReadableTimestamp: jest.fn(() => '2024-06-01 12:00:00'),
  getJavaCommand: jest.fn(),
}));

import * as maestro from '../../../src/cosimulation/maestro';
import { __setSimulationInProgress } from '../../../src/cosimulation/maestro';
import * as maestroUtils from '../../../src/utils/processes/maestroUtils';

beforeEach(() => {
  jest.clearAllMocks();
  (maestroUtils.getJavaCommand as jest.Mock).mockReturnValue('java');
});


const mockConfig = {
  cosimulationPath: '/mock/cosim',
  defaultPath: '/mock/cosim/default',
  simulationConfigPath: '/mock/config.json',
  fmusPath: '/mock/fmus',
  multiModels: '/mock/multi.json',
  outputPath: '/mock/output',
  logDirectory: '/mock/output/logs',
  maestroJarPath: '/mock/maestro.jar',
  tempMaestroJarPath: '/tmp/maestro-temp.jar',
};

describe('maestro.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractMaestroJar', () => {
    it('throws if maestroJarPath does not exist', () => {
      (fs.existsSync as jest.Mock).mockImplementation((p) => p !== '/mock/maestro.jar');
      expect(() => {
        maestro['extractMaestroJar']('/mock/maestro.jar', '/tmp/maestro-temp.jar');
      }).toThrow();
    });

    it('copies JAR if not already copied', () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true).mockReturnValueOnce(false);
      (fs.copyFileSync as jest.Mock).mockImplementation(() => { });
      maestro['extractMaestroJar']('/mock/maestro.jar', '/tmp/maestro-temp.jar');
      expect(fs.copyFileSync).toHaveBeenCalled();
    });

    it('throws if copy fails', () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true).mockReturnValueOnce(false);
      (fs.copyFileSync as jest.Mock).mockImplementation(() => { throw new Error('fail'); });
      expect(() => {
        maestro['extractMaestroJar']('/mock/maestro.jar', '/tmp/maestro-temp.jar');
      }).toThrow();
    });
  });

  describe('getLatestSimulationFolder', () => {
    it('returns null if config or baseDir missing', () => {
      jest.spyOn(configModule, 'getConfig').mockReturnValue(null);
      expect(maestro.getLatestSimulationFolder()).toBeNull();
    });

    it('returns null if baseDir does not exist', () => {
      jest.spyOn(configModule, 'getConfig').mockReturnValue(mockConfig);
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const result = maestro.getLatestSimulationFolder();
      expect(result).toBeNull();
    });

    it('returns null if no simulation folders found', () => {
      jest.spyOn(configModule, 'getConfig').mockReturnValue(mockConfig);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([]);
      const result = maestro.getLatestSimulationFolder();
      expect(result).toBeNull();
    });

    it('returns the most recent folder', () => {
      jest.spyOn(configModule, 'getConfig').mockReturnValue(mockConfig);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mockDirents = [
        { name: 'CoSimulation-1', isDirectory: () => true },
        { name: 'CoSimulation-2', isDirectory: () => true }
      ];
      (fs.readdirSync as jest.Mock).mockReturnValue(mockDirents);
      const timestamps: Record<string, Date> = {
        '/mock/output/CoSimulation-1': new Date('2024-01-01'),
        '/mock/output/CoSimulation-2': new Date('2024-06-01'),
      };
      (fs.statSync as jest.Mock).mockImplementation((path: string) => ({
        mtime: timestamps[path],
      }));
      (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
      const result = maestro.getLatestSimulationFolder();
      expect(result).toBe('/mock/output/CoSimulation-2');
    });
  });

  describe('startSimulation', () => {
    beforeEach(() => {
      jest.spyOn(configModule, 'getConfig').mockReturnValue({ ...mockConfig });
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => { });
      (fs.writeFileSync as jest.Mock).mockImplementation(() => { });
      (fs.createWriteStream as jest.Mock).mockReturnValue({
        write: jest.fn(),
        end: jest.fn(),
      });
      (fs.renameSync as jest.Mock).mockImplementation(() => { });
    });

    it('should return SimulationAlreadyInProgress', async () => {
      __setSimulationInProgress(true);
      const result = await maestro.startSimulation();
      expect(result.status).toBe(SimulationStatus.SimulationAlreadyInProgress);
      __setSimulationInProgress(false);
    });

    it('should throw if config is missing', async () => {
      jest.spyOn(configModule, 'getConfig').mockReturnValue(null);
      const result = await maestro.startSimulation();
      expect(result.status).toBe(SimulationStatus.SimulationFailed);
    });

    it('should throw if javaExecutable is not found', async () => {
      const { getJavaCommand } = await import('../../../src/utils/processes/maestroUtils');
      (getJavaCommand as jest.Mock).mockReturnValue(null);
      const result = await maestro.startSimulation();
      expect(result.success).toBe(false);
      expect(result.status).toBe(SimulationStatus.SimulationFailed);
    });

    it('should return success if simulation completes', async () => {
      execaMock.mockResolvedValue({
        all: {
          on: jest.fn((event, cb) => {
            if (event === 'data') cb(Buffer.from('Simulation Completed'));
          }),
        },
        exitCode: 0,
        stdout: 'Simulation Completed.',
        stderr: '',
      });
      const result = await maestro.startSimulation();
      console.log(result);
      expect(result.success).toBe(true);
      expect(result.status).toBe(SimulationStatus.SimulationCompleted);
    });

    it('should return failure if simulation fails with exitCode', async () => {
      execaMock.mockResolvedValue({
        all: {
          on: jest.fn((_, cb) => cb(Buffer.from('Simulation OK')))
        },
        exitCode: 1
      });
      const result = await maestro.startSimulation();
      expect(result.success).toBe(false);
      expect(result.status).toBe(SimulationStatus.SimulationFailed);
    });

    it('should handle non-Error exception object', async () => {
      jest.spyOn(configModule, 'getConfig').mockReturnValueOnce({ ...mockConfig });
      execaMock.mockImplementation(() => { throw 'string error'; });
      const result = await maestro.startSimulation();
      expect(result.success).toBe(false);
      expect(result.status).toBe(SimulationStatus.SimulationFailed);
    });

    it('should log stderr errors', async () => {
      execaMock.mockResolvedValue({
        all: {
          on: jest.fn((_, cb) => cb(Buffer.from('Simulation OK')))
        },
        exitCode: 1
      });
      const result = await maestro.startSimulation();
      expect(result.success).toBe(false);
    });

    it('should handle exception in simulation', async () => {
      jest.spyOn(configModule, 'getConfig').mockReturnValueOnce({ ...mockConfig });
      execaMock.mockImplementation(() => { throw new Error('Boom') });
      const result = await maestro.startSimulation();
      expect(result.success).toBe(false);
      expect(result.status).toBe(SimulationStatus.SimulationFailed);
    });
  });
});
