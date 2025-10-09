describe('themeManager', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('sends dark-mode-update to main and graph windows and updates currentDarkMode', () => {
    const mainSend = jest.fn();
    const graphSend = jest.fn();

    jest.doMock('../../../src/electron/gui/livePlottingWindow', () => ({
      graphWindowManager: { graphWindow: { webContents: { send: graphSend } } }
    }));

    const themeManager = require('../../../src/utils/themeManager');

    const mainWin = { webContents: { send: mainSend } };
    themeManager.registerMainWindow(mainWin);

    themeManager.sendDarkModeUpdate(true);

    expect(mainSend).toHaveBeenCalledWith('dark-mode-update', true);
    expect(graphSend).toHaveBeenCalledWith('dark-mode-update', true);
    expect(themeManager.getCurrentDarkMode()).toBe(true);
  });

  it('does not throw when no windows exist and still updates currentDarkMode', () => {
    jest.doMock('../../../src/electron/gui/livePlottingWindow', () => ({
      graphWindowManager: { graphWindow: null }
    }));

    const themeManager = require('../../../src/utils/themeManager');

    expect(() => themeManager.sendDarkModeUpdate(false)).not.toThrow();
    expect(themeManager.getCurrentDarkMode()).toBe(false);
  });

  it('skips windows missing webContents without throwing', () => {
    const graph = { webContents: undefined } as any;
    jest.doMock('../../../src/electron/gui/livePlottingWindow', () => ({
      graphWindowManager: { graphWindow: graph }
    }));

    const themeManager = require('../../../src/utils/themeManager');
    const mainWin = { webContents: undefined } as any;
    themeManager.registerMainWindow(mainWin);

    expect(() => themeManager.sendDarkModeUpdate(true)).not.toThrow();
    expect(themeManager.getCurrentDarkMode()).toBe(true);
  });
});
