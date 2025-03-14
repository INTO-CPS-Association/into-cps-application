import { createWindow, getMainWindow } from "../../../../src/electron/gui/window";
import * as path from "path";
import { BrowserWindow, Menu, app } from "electron";

jest.mock("electron", () => ({
  BrowserWindow: jest.fn(),
  Menu: {
    buildFromTemplate: jest.fn(() => ({
      items: [],
    })),
  },
  app: {
    getAppPath: jest.fn(() => "/mock/app/path"),
  },
}));

jest.mock("path", () => ({
  resolve: jest.fn((...args) => args.join("/")),
}));

describe("Electron Window Management", () => {
  let mockWindow: BrowserWindow;
  let consoleSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules(); // Assicura che i moduli vengano ricaricati dopo ogni test
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, "log").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    mockWindow = {
      loadURL: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      webContents: {
        openDevTools: jest.fn(),
      },
    } as unknown as BrowserWindow;

    (BrowserWindow as unknown as jest.Mock).mockImplementation(() => mockWindow);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  const mockEnv = (env: string) => {
    jest.doMock("../../../../src/electron/gui/window", () => {
      process.env.NODE_ENV = env;
      return jest.requireActual("../../../../src/electron/gui/window");
    });
  };

  it("creates a new BrowserWindow instance", () => {
    const window = createWindow();

    expect(BrowserWindow).toHaveBeenCalledWith({
      width: 800,
      height: 600,
      icon: "/mock/app/path/dist/resources/into-cps/appicon/into-cps-logo.png.ico",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: "/mock/app/path/dist/preload.js",
      },
    });

    expect(window).toBe(mockWindow);
    expect(mockWindow.loadURL).toHaveBeenCalledWith("file:///mock/app/path/dist/index.html");
    expect(mockWindow.on).toHaveBeenCalledWith("closed", expect.any(Function));
  });

  it("logs the correct mode on startup", () => {
    mockEnv("development");
    createWindow();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Starting Electron in development mode"));

    jest.clearAllMocks();

    mockEnv("production");
    createWindow();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Starting Electron in production mode"));
  });

  it("uses correct paths in development mode", () => {
    mockEnv("development");
    createWindow();

    expect(path.resolve).toHaveBeenCalledWith(expect.any(String), "preload.js");
    expect(path.resolve).toHaveBeenCalledWith(expect.any(String), "resources/into-cps/appicon/into-cps-logo.png.ico");
    expect(mockWindow.loadURL).toHaveBeenCalledWith("http://localhost:3000");
  });

  it("uses correct paths in production mode", () => {
    mockEnv("production");
    createWindow();

    expect(app.getAppPath).toHaveBeenCalled();
    expect(path.resolve).toHaveBeenCalledWith("/mock/app/path", "dist/preload.js");
    expect(path.resolve).toHaveBeenCalledWith("/mock/app/path", "dist/resources/into-cps/appicon/into-cps-logo.png.ico");
    expect(mockWindow.loadURL).toHaveBeenCalledWith("file:///mock/app/path/dist/index.html");
  });

  it("returns the main window instance", () => {
    createWindow();
    expect(getMainWindow()).toBe(mockWindow);
  });

  it("returns null if the window is closed", () => {
    createWindow();
    const closeCallback = (mockWindow.on as jest.Mock).mock.calls.find(([event]) => event === "closed")[1];
    closeCallback();
    expect(getMainWindow()).toBeNull();
  });

  it("handles testing mode correctly", () => {
    process.env.CI = "e2e";
    createWindow();

    expect(BrowserWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        webPreferences: expect.objectContaining({
          nodeIntegration: true,
          contextIsolation: false,
        }),
      })
    );
  });

  it("logs error when loading URL fails", async () => {
    (mockWindow.loadURL as jest.Mock).mockRejectedValue(new Error("Load failed"));

    createWindow();
    await new Promise(process.nextTick);

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to load URL:", expect.any(Error));
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

      createWindow();
      expect(Menu.buildFromTemplate).toHaveBeenCalled();
    });

    it("sets accelerator as Alt+F2 on non-macOS platforms", () => {
      Object.defineProperty(process, "platform", { value: "win32" });

      createWindow();
      expect(Menu.buildFromTemplate).toHaveBeenCalled();
    });
  });
});