describe('themeManager', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('sends dark-mode-update to main and graph windows and updates currentDarkMode', async () => {
    const mainSend = jest.fn();
    const graphSend = jest.fn();

    jest.doMock('../../../src/electron/gui/livePlottingWindow', () => ({
      graphWindowManager: { graphWindow: { webContents: { send: graphSend } } }
    }));

  const themeManager = await import('../../../src/utils/themeManager');

  const mainWin = { webContents: { send: mainSend } } as unknown as { webContents?: { send: jest.Mock } };
  (themeManager as unknown as { registerMainWindow: (w: unknown) => void }).registerMainWindow(mainWin);

    themeManager.sendDarkModeUpdate(true);

    expect(mainSend).toHaveBeenCalledWith('dark-mode-update', true);
    expect(graphSend).toHaveBeenCalledWith('dark-mode-update', true);
    expect(themeManager.getCurrentDarkMode()).toBe(true);
  });

  it('does not throw when no windows exist and still updates currentDarkMode', async () => {
    jest.doMock('../../../src/electron/gui/livePlottingWindow', () => ({
      graphWindowManager: { graphWindow: null }
    }));

  const themeManager = await import('../../../src/utils/themeManager');

  expect(() => (themeManager as unknown as { sendDarkModeUpdate: (b: boolean) => void }).sendDarkModeUpdate(false)).not.toThrow();
  expect((themeManager as unknown as { getCurrentDarkMode: () => boolean }).getCurrentDarkMode()).toBe(false);
  });

  it('skips windows missing webContents without throwing', async () => {
    const graph = { webContents: undefined } as unknown;
    jest.doMock('../../../src/electron/gui/livePlottingWindow', () => ({
      graphWindowManager: { graphWindow: graph }
    }));

  const themeManager = await import('../../../src/utils/themeManager');
  const mainWin = { webContents: undefined } as unknown;
  (themeManager as unknown as { registerMainWindow: (w: unknown) => void }).registerMainWindow(mainWin);

  expect(() => (themeManager as unknown as { sendDarkModeUpdate: (b: boolean) => void }).sendDarkModeUpdate(true)).not.toThrow();
  expect((themeManager as unknown as { getCurrentDarkMode: () => boolean }).getCurrentDarkMode()).toBe(true);
  });
});
