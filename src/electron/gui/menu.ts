import { Menu, BrowserWindow, app, MenuItemConstructorOptions } from 'electron';

let cosimulationEnabled = false;

export function createTopMenu(mainWindow: BrowserWindow): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Dark Mode',
          click: () => {
            if (mainWindow?.webContents) {
              console.log('Sending toggle-dark-mode to renderer...');
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
              console.log('Invoking menu-start-simulation...');
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