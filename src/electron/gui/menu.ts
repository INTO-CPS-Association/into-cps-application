import { Menu, BrowserWindow, MenuItemConstructorOptions, dialog } from 'electron';
import { getConfig, setProjectPath } from '../../utils/config';

let cosimulationEnabled = false;

export function createTopMenu(mainWindow: BrowserWindow): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Choose Project',
          id: 'choose-project',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory'],
              title: 'Select Project Folder',
            });
          
            if (!result.canceled && result.filePaths.length > 0) {
              const selectedPath = result.filePaths[0];          
              setProjectPath(selectedPath);
              
              mainWindow.webContents.send('project-selected', selectedPath);

              const config = getConfig();
              if (config && config.multiModels) {
                mainWindow.webContents.send('multi-model-path', config.multiModels);
                updateCosimulationMenu(mainWindow, true);
              }
            }
          },
        },
        { type: 'separator', id: 'file-separator' },
        { role: 'quit', label: 'Quit', id: 'quit-app' }
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Dark Mode',
          id: 'toggle-dark-mode',
          click: () => {
            if (mainWindow?.webContents) {
              mainWindow.webContents.send('toggle-dark-mode');
            } else {
              console.error('Main window or webContents is not available.');
            }
          },
        },
        {
          label: 'Toggle Developer Tools',
          id: 'toggle-dev-tools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          },
        },
      ],
    },
    {
      label: 'Cosimulation',
      submenu: [
        {
          label: 'Start Simulation',
          id: 'start-simulation',
          accelerator: process.platform === 'darwin' ? 'Cmd+F2' : 'Alt+F2',
          enabled: cosimulationEnabled,
          click: () => {
            if (mainWindow?.webContents) {
              mainWindow.webContents.send('menu-start-simulation');
            }
          },
        },
      ],
    },    
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

export function updateCosimulationMenu(mainWindow: BrowserWindow, enabled: boolean): void {
  cosimulationEnabled = enabled;
  createTopMenu(mainWindow);
}