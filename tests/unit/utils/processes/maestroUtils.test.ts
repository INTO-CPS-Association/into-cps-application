import * as child_process from 'node:child_process';
import * as logger from '../../../../src/utils/logger';
import * as maestroUtils from '../../../../src/utils/processes/maestroUtils';

jest.mock('node:child_process');
jest.mock('../../../../src/utils/logger');

describe('maestroUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getReadableTimestamp', () => {
    it('returns a properly formatted timestamp', () => {
      const { getReadableTimestamp } = maestroUtils;

      const timestamp = getReadableTimestamp();
      expect(timestamp).toMatch(/\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/);
    });
  });

  describe('getJavaCommand', () => {
    it('returns java path if found', () => {
      const mockedExecSync = child_process.execSync as jest.Mock;
      mockedExecSync.mockReturnValue(Buffer.from('/usr/bin/java\n'));

      const { getJavaCommand } = maestroUtils;
      const javaPath = getJavaCommand();

      expect(javaPath).toBe('/usr/bin/java');
      expect(mockedExecSync).toHaveBeenCalled();
    });

    it('returns fallback and logs warning if java not found', () => {
      const mockedExecSync = child_process.execSync as jest.Mock;
      mockedExecSync.mockImplementation(() => { throw new Error('not found'); });

      const logWarnMock = logger.logWarn as jest.Mock;

      const { getJavaCommand } = maestroUtils;
      const javaPath = getJavaCommand();

      expect(javaPath).toBe('java');
      expect(logWarnMock).toHaveBeenCalledWith('[Maestro] Java not found in PATH:');
    });
  });
});