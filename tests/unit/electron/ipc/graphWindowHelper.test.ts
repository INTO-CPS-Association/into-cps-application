import * as graphHelper from '../../../../src/electron/ipc/graphWindowHelper';
import { ipcRenderer, ipcMain } from 'electron';

jest.mock('electron', () => ({
  ipcRenderer: {
    send: jest.fn(),
  },
  ipcMain: {
    emit: jest.fn(),
  },
}));

describe('sendGraphWindowOpen', () => {
  let originalProcessType: string | undefined;

  beforeAll(() => {
    originalProcessType = process.type;
  });

  afterAll(() => {
    Object.defineProperty(process, 'type', {
      value: originalProcessType,
      configurable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send ipcRenderer event when in renderer process', () => {
    Object.defineProperty(process, 'type', {
      value: 'renderer',
      configurable: true,
    });

    graphHelper.sendGraphWindowOpen();

    expect(ipcRenderer.send).toHaveBeenCalledWith('open-graph-window');
    expect(ipcMain.emit).not.toHaveBeenCalled();
  });

  it('should emit ipcMain event when in browser process', () => {
    Object.defineProperty(process, 'type', {
      value: 'browser',
      configurable: true,
    });

    graphHelper.sendGraphWindowOpen();

    expect(ipcMain.emit).toHaveBeenCalledWith('open-graph-window', null);
    expect(ipcRenderer.send).not.toHaveBeenCalled();
  });

  it('should do nothing if process.type is undefined or other', () => {
    Object.defineProperty(process, 'type', {
      value: undefined,
      configurable: true,
    });

    graphHelper.sendGraphWindowOpen();

    expect(ipcRenderer.send).not.toHaveBeenCalled();
    expect(ipcMain.emit).not.toHaveBeenCalled();
  });
});