import { electronAPI } from "../../../src/electron/electronApi";
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import type { IpcRenderer } from 'electron';

jest.mock("electron", () => ({
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  },
  ipcRenderer: {
    on: jest.fn(),
    off: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

const mockedContextBridge = contextBridge as unknown as { exposeInMainWorld: jest.Mock };
const mockedIpcRenderer = ipcRenderer as unknown as jest.Mocked<IpcRenderer>;

describe("Electron API", () => {
  it("exposes electronAPI in main world", () => {
    expect(mockedContextBridge.exposeInMainWorld).toHaveBeenCalledWith(
      "electronAPI",
      expect.objectContaining({
        addErrorListener: expect.any(Function),
        addNotificationListener: expect.any(Function),
        addToggleDarkModeListener: expect.any(Function),
        getDarkMode: expect.any(Function),
        off: expect.any(Function),
        on: expect.any(Function),
        readFile: expect.any(Function),
        writeFile: expect.any(Function),
        toggleDarkMode: expect.any(Function),
      })
    );
  });

  it("adds toggle dark mode listener", () => {
    const callback = jest.fn();
  electronAPI.addToggleDarkModeListener(callback);
  expect(mockedIpcRenderer.on).toHaveBeenCalledWith("toggle-dark-mode", callback);
  });

  it("removes toggle dark mode listener", () => {
  electronAPI.removeToggleDarkModeListener();
  expect(mockedIpcRenderer.removeAllListeners).toHaveBeenCalledWith("toggle-dark-mode");
  });

  it("adds error listener with valid callback", () => {
    const callback = jest.fn();
    electronAPI.addErrorListener(callback);

  const showErrorHandler = (mockedIpcRenderer.on as jest.Mock).mock.calls.find(call => call[0] === "show-error")?.[1];

  expect(mockedIpcRenderer.on).toHaveBeenCalledWith("show-error", expect.any(Function));

    if (showErrorHandler) {
      showErrorHandler({} as IpcRendererEvent, "Test Error");
      expect(callback).toHaveBeenCalledWith("Test Error");
    } else {
      throw new Error("show-error event handler not found");
    }
  });

  it("does not add error listener without valid callback", async () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    const { electronAPI } = await import("../../../src/electron/electronApi");
    electronAPI.addErrorListener(undefined);
    expect(consoleWarnSpy).toHaveBeenCalledWith("[ElectronAPI] addErrorListener called without a valid callback");
    consoleWarnSpy.mockRestore();
  });
  

  it("removes error listener", () => {
  electronAPI.removeErrorListener();
  expect(mockedIpcRenderer.removeAllListeners).toHaveBeenCalledWith("show-error");
  });

  it("adds a generic event listener", () => {
    const callback = jest.fn();
    electronAPI.on("custom-event", callback);

    const customEventHandler = (mockedIpcRenderer.on as jest.Mock).mock.calls.find(call => call[0] === "custom-event")?.[1];

    expect(mockedIpcRenderer.on).toHaveBeenCalledWith("custom-event", expect.any(Function));

    if (customEventHandler) {
      customEventHandler({} as IpcRendererEvent, "arg1", "arg2");
      expect(callback).toHaveBeenCalledWith("arg1", "arg2");
    } else {
      throw new Error("custom-event event handler not found");
    }
  });

  it("removes a generic event listener", () => {
    const callback = jest.fn();
  electronAPI.off("custom-event", callback);
  expect(mockedIpcRenderer.off).toHaveBeenCalledWith("custom-event", callback);
  });
});