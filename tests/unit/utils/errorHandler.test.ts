import { handleError } from '../../../src/utils/errorHandler';
import { ipcMain } from 'electron';

jest.mock('electron', () => ({
  ipcMain: {
    emit: jest.fn(),
  },
}));

describe('handleError', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let originalProcess: typeof process;
  let originalWindow: typeof window;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    originalProcess = global.process;
    originalWindow = globalThis.window;

    Object.defineProperty(globalThis, 'process', {
      value: { ...originalProcess },
      writable: true,
    });

    Object.defineProperty(globalThis, 'window', {
      value: { electronAPI: { dispatchActionToMain: jest.fn() } },
      writable: true,
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    Object.defineProperty(globalThis, 'process', { value: originalProcess });
    Object.defineProperty(globalThis, 'window', { value: originalWindow });
  });

  it('logs an error message', () => {
    handleError(new Error('Test Error'));
    expect(consoleErrorSpy).toHaveBeenCalledWith('[handleError Triggered]:', 'Test Error');
  });

  it('sends error to main process in renderer mode', () => {
    Object.defineProperty(globalThis.process, 'type', { value: 'renderer' });

    handleError(new Error('Renderer Error'));

    expect(globalThis.window.electronAPI.dispatchActionToMain).toHaveBeenCalledWith({
      type: 'error',
      payload: { message: 'Renderer Error' },
    });
  });

  it('warns if electronAPI is missing in renderer mode', () => {
    Object.defineProperty(globalThis.process, 'type', { value: 'renderer' });
    Object.defineProperty(globalThis, 'window', { value: {} });

    handleError(new Error('Renderer Error'));

    expect(consoleWarnSpy).toHaveBeenCalledWith('[handleError] electronAPI not found in renderer!');
  });

  it('emits error event in main process (browser)', () => {
    Object.defineProperty(globalThis.process, 'type', { value: 'browser' });

    handleError(new Error('Main Process Error'));

    expect(ipcMain.emit).toHaveBeenCalledWith('trigger-error', null, 'Main Process Error');
  });

  it('logs a warning for unknown process type', () => {
    Object.defineProperty(globalThis.process, 'type', { value: 'unknown' });

    handleError(new Error('Unknown Process Error'));

    expect(consoleWarnSpy).toHaveBeenCalledWith('[handleError] Unknown process type!');
  });

  it('handles non-Error values correctly', () => {
    handleError('Simple string error');

    expect(consoleErrorSpy).toHaveBeenCalledWith('[handleError Triggered]:', 'Simple string error');
  });

  it('handles null error input correctly', () => {
    handleError(null);

    expect(consoleErrorSpy).toHaveBeenCalledWith('[handleError Triggered]:', 'null');
  });

  it('handles undefined error input correctly', () => {
    handleError(undefined);

    expect(consoleErrorSpy).toHaveBeenCalledWith('[handleError Triggered]:', 'undefined');
  });
});