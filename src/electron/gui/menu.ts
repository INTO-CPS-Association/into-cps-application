import { Menu, BrowserWindow, MenuItemConstructorOptions, dialog } from 'electron';
import { getConfig, setProjectPath } from '../../utils/config';
import { graphWindowManager } from './livePlottingWindow';
import { LABELS, SHORTCUTS } from '../../utils/constants';

let cosimulationEnabled = false;

export function createTopMenu(mainWindow: BrowserWindow): void {
  const startSimulationShortcut = process.platform === "darwin" ? "Cmd+F2" : "Alt+F2";

  const template: MenuItemConstructorOptions[] = [
    {
      label: LABELS.Menu.File,
      submenu: [
        {
          label: "Create New Project",
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow, {
              title: "Create new project",
              buttonLabel: "Create",
              defaultPath: "NewProject"
            });
        
            if (!result.canceled && result.filePath) {
              mainWindow.webContents.send("create-new-project", result.filePath);
            }
          },
        },        
        {
          label: LABELS.Menu.ChooseProject.Label,
          id: 'choose-project',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory'],
              title: LABELS.Menu.ChooseProject.Dialogue,
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
        { role: 'quit', label: LABELS.Menu.Quit, id: 'quit-app' }
      ],
    },
    {
      label: LABELS.Menu.View,
      submenu: [
        {
          label: LABELS.Menu.ToggleDarkMode,
          id: 'toggle-dark-mode',
          click: () => {
            mainWindow?.webContents.send('toggle-dark-mode');
            graphWindowManager.graphWindow?.webContents.send('toggle-dark-mode');
          },
        },
        {
          label: LABELS.Menu.ToggleDevTools,
          id: 'toggle-dev-tools',
          accelerator: SHORTCUTS.Menu.DevTools,
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          },
        },
      ],
    },
    {
      label: LABELS.Menu.Cosimulation,
      submenu: [
        {
          label: LABELS.Menu.StartSimulation,
          id: 'start-simulation',
          accelerator: startSimulationShortcut,
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