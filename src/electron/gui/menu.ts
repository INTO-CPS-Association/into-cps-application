import { Menu, BrowserWindow, MenuItemConstructorOptions, dialog } from 'electron';
import { setProjectPath } from '../../utils/config';

let cosimulationEnabled = false;

export function createTopMenu(mainWindow: BrowserWindow): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Choose Project',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory'],
              title: 'Select Project Folder',
            });
          
            if (!result.canceled && result.filePaths.length > 0) {
              const selectedPath = result.filePaths[0];          
              setProjectPath(selectedPath);
              mainWindow.webContents.send('project-selected', selectedPath);
            }
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Dark Mode',
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
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            } else {
              console.error('Main window is not available.');
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
          accelerator: process.platform === 'darwin' ? 'Cmd+F2' : 'Alt+F2',
          enabled: cosimulationEnabled,
          click: () => {
            if (mainWindow?.webContents) {
              mainWindow.webContents.send('menu-start-simulation');
            } else {
              console.error('Main window or webContents is not available.');
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