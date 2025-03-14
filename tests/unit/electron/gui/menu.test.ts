import { createTopMenu, updateCosimulationMenu } from "../../../../src/electron/gui/menu";
import { BrowserWindow, Menu, dialog, MenuItemConstructorOptions } from "electron";
import { setProjectPath } from "../../../../src/utils/config";

jest.mock("electron", () => ({
  BrowserWindow: jest.fn(),
  Menu: {
    buildFromTemplate: jest.fn(() => ({
      items: [],
    })),
    setApplicationMenu: jest.fn(),
  },
  dialog: {
    showOpenDialog: jest.fn(),
  },
}));

jest.mock("../../../../src/utils/config", () => ({
  setProjectPath: jest.fn(),
}));

describe("Electron GUI Menu", () => {
  let mockWindow: BrowserWindow;

  beforeEach(() => {
    mockWindow = {
      webContents: {
        send: jest.fn(),
        toggleDevTools: jest.fn(),
      },
    } as unknown as BrowserWindow;

    jest.clearAllMocks();
  });

  it("creates the top menu and sets it as application menu", () => {
    createTopMenu(mockWindow);

    expect(Menu.buildFromTemplate).toHaveBeenCalled();
    expect(Menu.setApplicationMenu).toHaveBeenCalled();
  });

  it("handles project selection and updates main window", async () => {
    (dialog.showOpenDialog as jest.Mock).mockResolvedValue({
      canceled: false,
      filePaths: ["/mock/project/path"],
    });

    createTopMenu(mockWindow);
    const fileMenu = (Menu.buildFromTemplate as jest.Mock).mock.calls[0][0][0];

    const chooseProjectItem = (fileMenu.submenu as MenuItemConstructorOptions[]).find(
      (item: MenuItemConstructorOptions) => item.id === "choose-project"
    );

    if (!chooseProjectItem || !chooseProjectItem.click) {
      throw new Error("Menu item 'choose-project' not found or invalid");
    }

    await chooseProjectItem.click({} as Electron.MenuItem, mockWindow, {} as Electron.KeyboardEvent);

    expect(setProjectPath).toHaveBeenCalledWith("/mock/project/path");
    expect(mockWindow.webContents.send).toHaveBeenCalledWith("project-selected", "/mock/project/path");
  });

  it("logs error when toggling dark mode with missing window", () => {
    createTopMenu(null as unknown as BrowserWindow);
    const viewMenu = (Menu.buildFromTemplate as jest.Mock).mock.calls[0][0][1];

    const toggleDarkModeItem = (viewMenu.submenu as MenuItemConstructorOptions[]).find(
      (item: MenuItemConstructorOptions) => item.id === "toggle-dark-mode"
    );

    if (!toggleDarkModeItem || !toggleDarkModeItem.click) return;

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    toggleDarkModeItem.click({} as Electron.MenuItem, null as unknown as BrowserWindow, {} as Electron.KeyboardEvent);

    expect(consoleSpy).toHaveBeenCalledWith("Main window or webContents is not available.");
    consoleSpy.mockRestore();
  });

  it("logs error when toggling developer tools with missing window", () => {
    createTopMenu(null as unknown as BrowserWindow);
    const viewMenu = (Menu.buildFromTemplate as jest.Mock).mock.calls[0][0][1];

    const toggleDevToolsItem = (viewMenu.submenu as MenuItemConstructorOptions[]).find(
      (item: MenuItemConstructorOptions) => item.id === "toggle-dev-tools"
    );

    if (!toggleDevToolsItem || !toggleDevToolsItem.click) return;

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    toggleDevToolsItem.click({} as Electron.MenuItem, null as unknown as BrowserWindow, {} as Electron.KeyboardEvent);

    expect(consoleSpy).toHaveBeenCalledWith("Main window is not available.");
    consoleSpy.mockRestore();
  });

  it("logs error when starting simulation with missing window", () => {
    createTopMenu(null as unknown as BrowserWindow);
    const cosimulationMenu = (Menu.buildFromTemplate as jest.Mock).mock.calls[0][0][2];

    const startSimulationItem = (cosimulationMenu.submenu as MenuItemConstructorOptions[]).find(
      (item: MenuItemConstructorOptions) => item.id === "start-simulation"
    );

    if (!startSimulationItem || !startSimulationItem.click) return;

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    startSimulationItem.click({} as Electron.MenuItem, null as unknown as BrowserWindow, {} as Electron.KeyboardEvent);

    expect(consoleSpy).toHaveBeenCalledWith("Main window or webContents is not available.");
    consoleSpy.mockRestore();
  });

  it("toggles dark mode when clicking the menu item", () => {
    createTopMenu(mockWindow);
    const viewMenu = (Menu.buildFromTemplate as jest.Mock).mock.calls[0][0][1];

    const toggleDarkModeItem = (viewMenu.submenu as MenuItemConstructorOptions[]).find(
      (item: MenuItemConstructorOptions) => item.id === "toggle-dark-mode"
    );

    if (!toggleDarkModeItem || !toggleDarkModeItem.click) return;

    toggleDarkModeItem.click({} as Electron.MenuItem, mockWindow, {} as Electron.KeyboardEvent);

    expect(mockWindow.webContents.send).toHaveBeenCalledWith("toggle-dark-mode");
  });

  it("toggles developer tools", () => {
    createTopMenu(mockWindow);
    const viewMenu = (Menu.buildFromTemplate as jest.Mock).mock.calls[0][0][1];

    const toggleDevToolsItem = (viewMenu.submenu as MenuItemConstructorOptions[]).find(
      (item: MenuItemConstructorOptions) => item.id === "toggle-dev-tools"
    );

    if (!toggleDevToolsItem || !toggleDevToolsItem.click) return;

    toggleDevToolsItem.click({} as Electron.MenuItem, mockWindow, {} as Electron.KeyboardEvent);

    expect(mockWindow.webContents.toggleDevTools).toHaveBeenCalled();
  });

  it("sends start simulation event to main window", () => {
    createTopMenu(mockWindow);
    const cosimulationMenu = (Menu.buildFromTemplate as jest.Mock).mock.calls[0][0][2];

    const startSimulationItem = (cosimulationMenu.submenu as MenuItemConstructorOptions[]).find(
      (item: MenuItemConstructorOptions) => item.id === "start-simulation"
    );

    if (!startSimulationItem || !startSimulationItem.click) return;

    startSimulationItem.click({} as Electron.MenuItem, mockWindow, {} as Electron.KeyboardEvent);

    expect(mockWindow.webContents.send).toHaveBeenCalledWith("menu-start-simulation");
  });

  it("updates cosimulation menu state", () => {
    createTopMenu(mockWindow);
    updateCosimulationMenu(mockWindow, true);

    expect(Menu.buildFromTemplate).toHaveBeenCalledTimes(2);
    expect(Menu.setApplicationMenu).toHaveBeenCalledTimes(2);
  });

  describe("Accelerator key coverage", () => {
    let originalPlatform: string;

    beforeAll(() => {
      originalPlatform = process.platform;
    });

    afterEach(() => {
      Object.defineProperty(process, "platform", {
        value: originalPlatform,
      });
    });

    it("sets accelerator as Cmd+F2 on macOS (darwin)", () => {
      Object.defineProperty(process, "platform", { value: "darwin" });

      createTopMenu(mockWindow);
      const cosimulationMenu = (Menu.buildFromTemplate as jest.Mock).mock.calls[0][0][2];

      const startSimulationItem = (cosimulationMenu.submenu as MenuItemConstructorOptions[]).find(
        (item: MenuItemConstructorOptions) => item.id === "start-simulation"
      );

      expect(startSimulationItem?.accelerator).toBe("Cmd+F2");
    });

    it("sets accelerator as Alt+F2 on non-macOS platforms", () => {
      Object.defineProperty(process, "platform", { value: "win32" });

      createTopMenu(mockWindow);
      const cosimulationMenu = (Menu.buildFromTemplate as jest.Mock).mock.calls[0][0][2];

      const startSimulationItem = (cosimulationMenu.submenu as MenuItemConstructorOptions[]).find(
        (item: MenuItemConstructorOptions) => item.id === "start-simulation"
      );

      expect(startSimulationItem?.accelerator).toBe("Alt+F2");
    });
  });
});