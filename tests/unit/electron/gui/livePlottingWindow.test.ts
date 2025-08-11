import { BrowserWindow } from 'electron';
import { graphWindowManager } from '../../../../src/electron/gui/livePlottingWindow';

jest.mock('electron', () => {
  const original = jest.requireActual('electron');
  return {
    ...original,
    app: {
      getAppPath: jest.fn(() => '/mock/app/path'),
    },
    BrowserWindow: jest.fn(),
  };
});

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

describe('openGraphHtmlWindow', () => {
  let mockBrowserWindowInstance: any;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mockBrowserWindowInstance = {
      isDestroyed: jest.fn(),
      isMinimized: jest.fn(),
      restore: jest.fn(),
      focus: jest.fn(),
      once: jest.fn(),
      loadURL: jest.fn(),
      on: jest.fn(),
      show: jest.fn(),
    };

    const BrowserWindowMock = BrowserWindow as unknown as jest.Mock;
    BrowserWindowMock.mockImplementation(() => mockBrowserWindowInstance);
  });

  it('should focus existing window if not destroyed and not minimized', () => {
    mockBrowserWindowInstance.isDestroyed.mockReturnValue(false);
    mockBrowserWindowInstance.isMinimized.mockReturnValue(false);

    graphWindowManager.graphWindow = mockBrowserWindowInstance;

    graphWindowManager.openGraphHtmlWindow();

    expect(mockBrowserWindowInstance.focus).toHaveBeenCalled();
    expect(mockBrowserWindowInstance.restore).not.toHaveBeenCalled();
    expect(BrowserWindow).not.toHaveBeenCalled();
  });

  it('should restore and focus existing minimized window', () => {
    mockBrowserWindowInstance.isDestroyed.mockReturnValue(false);
    mockBrowserWindowInstance.isMinimized.mockReturnValue(true);

    graphWindowManager.graphWindow = mockBrowserWindowInstance;

    graphWindowManager.openGraphHtmlWindow();

    expect(mockBrowserWindowInstance.restore).toHaveBeenCalled();
    expect(mockBrowserWindowInstance.focus).toHaveBeenCalled();
    expect(BrowserWindow).not.toHaveBeenCalled();
  });

  it('should create a new BrowserWindow if none exists or destroyed', () => {
    graphWindowManager.graphWindow = null;

    process.env.NODE_ENV = 'development';

    graphWindowManager.openGraphHtmlWindow();

    expect(BrowserWindow).toHaveBeenCalledWith({
      width: 900,
      height: 700,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    expect(mockBrowserWindowInstance.loadURL).toHaveBeenCalledWith('http://localhost:3000/#/live-plotting');
    expect(mockBrowserWindowInstance.once).toHaveBeenCalledWith('ready-to-show', expect.any(Function));
    expect(mockBrowserWindowInstance.on).toHaveBeenCalledWith('closed', expect.any(Function));
  });

  it('should load file URL in production mode', () => {
    graphWindowManager.graphWindow = null;
    process.env.NODE_ENV = 'production';

    graphWindowManager.openGraphHtmlWindow();

    const expectedUrl = `file:///mock/app/path/dist/index.html#/live-plotting`;
    expect(mockBrowserWindowInstance.loadURL).toHaveBeenCalledWith(expectedUrl);
  });

  it('should set graphWindow to null on close event', () => {
    graphWindowManager.graphWindow = null;

    graphWindowManager.openGraphHtmlWindow();

    const closedHandler = mockBrowserWindowInstance.on.mock.calls.find(
      (call: [string, Function]) => call[0] === 'closed'
    )?.[1];

    expect(closedHandler).toBeDefined();

    closedHandler();

    expect(graphWindowManager.graphWindow).toBeNull();
  });

  it('should show window on ready-to-show', () => {
    graphWindowManager.graphWindow = null;

    graphWindowManager.openGraphHtmlWindow();

    const readyToShowHandler = mockBrowserWindowInstance.once.mock.calls.find(
      (call: [string, Function]) => call[0] === 'ready-to-show'
    )?.[1];

    expect(readyToShowHandler).toBeDefined();

    readyToShowHandler();

    expect(mockBrowserWindowInstance.show).toHaveBeenCalled();
  });
});