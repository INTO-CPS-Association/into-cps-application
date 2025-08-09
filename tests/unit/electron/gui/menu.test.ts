import { BrowserWindow, Menu, dialog } from 'electron';
import * as config from '../../../../src/utils/config';
import { createTopMenu, updateCosimulationMenu } from '../../../../src/electron/gui/menu';
import { logError } from '../../../../src/utils/logger';

jest.mock('electron', () => ({
  dialog: {
    showOpenDialog: jest.fn(),
  },
  Menu: {
    buildFromTemplate: jest.fn(() => ({
      items: [],
    })),
    setApplicationMenu: jest.fn(),
  },
}));

jest.mock('../../../../src/utils/config', () => ({
  getConfig: jest.fn(),
  setProjectPath: jest.fn(),
}));

jest.mock('../../../../src/utils/logger', () => ({
  logError: jest.fn(),
}));

describe('menu.ts', () => {
  const mockSend = jest.fn();
  const mockWindow = {
    webContents: {
      send: mockSend,
      toggleDevTools: jest.fn(),
    },
  } as unknown as BrowserWindow;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create menu and handle project selection', async () => {
    (dialog.showOpenDialog as jest.Mock).mockResolvedValue({
      canceled: false,
      filePaths: ['/mock/path'],
    });

    (config.getConfig as jest.Mock).mockReturnValue({
      multiModels: 'multi.json',
    });

    await createTopMenu(mockWindow);
    const fileMenu = (Menu.buildFromTemplate as jest.Mock).mock.calls[0][0][0];
    const chooseProjectItem = fileMenu.submenu?.find(
      (item: { id: string }) => item.id === 'choose-project'
    );

    if (!chooseProjectItem?.click) throw new Error('choose-project click missing');

    await chooseProjectItem.click!(
      {} as import('electron').MenuItem,
      mockWindow,
      {} as Electron.Event
    );
    
    expect(config.setProjectPath).toHaveBeenCalledWith('/mock/path');
    expect(mockSend).toHaveBeenCalledWith('project-selected', '/mock/path');
    expect(mockSend).toHaveBeenCalledWith('multi-model-path', 'multi.json');
    expect(Menu.setApplicationMenu).toHaveBeenCalled();
  });

  it('should update cosimulation menu by calling createTopMenu', () => {
    updateCosimulationMenu(mockWindow, true);
    expect(Menu.setApplicationMenu).toHaveBeenCalled();
  });

  it('should toggle dark mode if webContents exists', async () => {
    createTopMenu(mockWindow);
    const viewMenu = (Menu.buildFromTemplate as jest.Mock).mock.calls[0][0][1];
    const toggleItem = viewMenu.submenu?.find(
      (item: { id?: string }) => item.id === 'toggle-dark-mode'
    );  
    toggleItem.click();
    expect(logError).toHaveBeenCalledWith('Main window or webContents is not available.');
  });

  it('should toggle dev tools if mainWindow exists', () => {
    createTopMenu(mockWindow);
    const viewMenu = (Menu.buildFromTemplate as jest.Mock).mock.calls[0][0][1];
    const devToolsItem = viewMenu.submenu?.find((item: { id: string }) => item.id === 'toggle-dev-tools');

    devToolsItem.click();
    expect(mockWindow.webContents.toggleDevTools).toHaveBeenCalled();
  });

  it('should send simulation event if webContents exists', () => {
    createTopMenu(mockWindow);
    const cosimMenu = (Menu.buildFromTemplate as jest.Mock).mock.calls[0][0][2];
    const simItem = cosimMenu.submenu?.find((item: { id: string }) => item.id === 'start-simulation');

    simItem.click();
    expect(mockSend).toHaveBeenCalledWith('menu-start-simulation');
  });

});
