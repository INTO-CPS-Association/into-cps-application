import { Menu, BrowserWindow, app, ipcMain, MenuItemConstructorOptions } from 'electron';

export function createTopMenu(mainWindow: BrowserWindow | null): void {
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
          click: () => mainWindow?.webContents.send('toggle-dark-mode'),
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
            mainWindow?.webContents.toggleDevTools();
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
          click: async () => {
            ipcMain.emit('start-simulation');
          },
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}