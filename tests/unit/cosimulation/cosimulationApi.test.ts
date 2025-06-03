import { ipcRenderer } from 'electron';

jest.mock('electron', () => ({
  ipcRenderer: {
    invoke: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  contextBridge: {
    exposeInMainWorld: jest.fn()
  }
}));

describe('cosimulationAPI', () => {
  let cosimulationAPI: typeof import('../../../src/cosimulation/cosimulationApi').cosimulationAPI;

  beforeEach(() => {
    jest.resetModules();
    cosimulationAPI = require('../../../src/cosimulation/cosimulationApi').cosimulationAPI;
  });

  it('calls ipcRenderer.invoke for maestro', async () => {
    const args = { type: 'start', data: { foo: 'bar' } };
    await cosimulationAPI.maestro(args);
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('maestro', args);
  });

  it('registers and unregisters simulation-status listener', () => {
    const cb = jest.fn();
    cosimulationAPI.onSimulationStatus(cb);
    expect(ipcRenderer.on).toHaveBeenCalledWith('simulation-status', cb);

    cosimulationAPI.removeSimulationStatusListener(cb);
    expect(ipcRenderer.off).toHaveBeenCalledWith('simulation-status', cb);
  });

  it('adds and removes coe-error listener', () => {
    const cb = jest.fn();
    cosimulationAPI.addCoeErrorListener(cb);

    const [eventName, wrappedCallback] = (ipcRenderer.on as jest.Mock).mock.calls[0];
    expect(eventName).toBe('coe-error');
    wrappedCallback('event', 'ERROR MSG');
    expect(cb).toHaveBeenCalledWith('event', 'ERROR MSG');

    cosimulationAPI.removeCoeErrorListener();
    expect(ipcRenderer.removeAllListeners).toHaveBeenCalledWith('coe-error');
  });

  it('adds and removes coe-reset listener', () => {
    const cb = jest.fn();
    cosimulationAPI.addCoeResetListener(cb);
    expect(ipcRenderer.on).toHaveBeenCalledWith('coe-reset', cb);

    cosimulationAPI.removeCoeResetListener();
    expect(ipcRenderer.removeAllListeners).toHaveBeenCalledWith('coe-reset');
  });

  it('uses generic on and off correctly', () => {
    const cb = jest.fn();
    cosimulationAPI.on('custom-event', cb);

    const [eventName, wrapper] = (ipcRenderer.on as jest.Mock).mock.calls.find(call => call[0] === 'custom-event');
    expect(eventName).toBe('custom-event');

    wrapper('event', 'arg1', 'arg2');
    expect(cb).toHaveBeenCalledWith('arg1', 'arg2');

    cosimulationAPI.off('custom-event', cb);
    expect(ipcRenderer.off).toHaveBeenCalledWith('custom-event', cb);
  });

  it('invokes getConfig', async () => {
    await cosimulationAPI.getConfig();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-config');
  });

  it('invokes getLatestResultFolder', async () => {
    await cosimulationAPI.getLatestResultFolder();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('get-latest-result-folder');
  });
});
