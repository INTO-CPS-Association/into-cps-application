import net from 'net';
import { exec } from 'node:child_process';
import kill from 'tree-kill';
import { isPortInUse, killProcessOnPort } from '../../../../src/utils/processes/maestroUtils';

jest.mock('net');
jest.mock('node:child_process', () => ({
  exec: jest.fn(),
}));
jest.mock('tree-kill', () => jest.fn());

describe('isPortInUse', () => {
  let mockServer: jest.MockedObject<net.Server>;

  beforeEach(() => {
    mockServer = {
      once: jest.fn(),
      listen: jest.fn(),
      close: jest.fn(),
    } as unknown as jest.MockedObject<net.Server>;

    (net.createServer as jest.Mock).mockReturnValue(mockServer);
  });

  it('should return true if port is in use', async () => {
    mockServer.once.mockImplementation((event: string, callback: () => void) => {
      if (event === 'error') {
        callback();
      }
      return mockServer;
    });

    await expect(isPortInUse(3000)).resolves.toBe(true);
    expect(net.createServer).toHaveBeenCalled();
    expect(mockServer.once).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('should return false if port is available', async () => {
    mockServer.once.mockImplementation((event: string, callback: () => void) => {
      if (event === 'listening') {
        callback();
      }
      return mockServer;
    });
    mockServer.close.mockImplementation((callback?: (err?: Error) => void) => {
      if (callback) callback(undefined);
      return mockServer;
    });

    await expect(isPortInUse(3000)).resolves.toBe(false);
    expect(mockServer.once).toHaveBeenCalledWith('listening', expect.any(Function));
    expect(mockServer.close).toHaveBeenCalled();
  });
});

describe('killProcessOnPort', () => {
  let mockedExec: jest.MockedFunction<(cmd: string, callback: (error: Error | null, stdout: string) => void) => void>;
  let mockedKill: jest.MockedFunction<(pid: number, signal: string, callback: (err?: Error) => void) => void>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedExec = exec as unknown as jest.MockedFunction<
      (cmd: string, callback: (error: Error | null, stdout: string) => void) => void
    >;
    mockedKill = kill as unknown as jest.MockedFunction<
      (pid: number, signal: string, callback: (err?: Error) => void) => void
    >;
  });

  it('should resolve if no process is found on the port', async () => {
    mockedExec.mockImplementation((_cmd, callback) => callback(new Error('No process'), ''));

    await expect(killProcessOnPort(3000)).resolves.toBeUndefined();
    expect(exec).toHaveBeenCalled();
  });

  it('should resolve if output is empty', async () => {
    mockedExec.mockImplementation((_cmd, callback) => callback(null, ''));

    await expect(killProcessOnPort(3000)).resolves.toBeUndefined();
    expect(exec).toHaveBeenCalled();
  });

  it('should resolve if no valid PID is found', async () => {
    mockedExec.mockImplementation((_cmd, callback) => callback(null, 'random text'));

    await expect(killProcessOnPort(3000)).resolves.toBeUndefined();
  });

  it('should kill processes on the given port', async () => {
    const pid = 1234;
    const output = process.platform === 'win32'
      ? `TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    ${pid}`
      : `COMMAND ${pid}`;

    mockedExec.mockImplementation((_cmd, callback) => callback(null, output));
    mockedKill.mockImplementation((_pid, _signal, callback) => callback?.());

    await expect(killProcessOnPort(3000)).resolves.toBeUndefined();
    expect(mockedKill).toHaveBeenCalledWith(pid, 'SIGTERM', expect.any(Function));
  });

  it('should log an error if process killing fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const pid = 1234;
    const output = process.platform === 'win32'
      ? `TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    ${pid}`
      : `COMMAND ${pid}`;

    mockedExec.mockImplementation((_cmd, callback) => callback(null, output));
    mockedKill.mockImplementation((_pid, _signal, callback) => callback?.(new Error('Kill failed')));

    await expect(killProcessOnPort(3000)).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to kill process with PID 1234'),
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});