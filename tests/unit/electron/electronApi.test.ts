import { electronAPI } from "../../../src/electron/electronApi";
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

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

describe("Electron API", () => {
  it("exposes electronAPI in main world", () => {
    expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith("electronAPI", electronAPI);
  });

  it("adds toggle dark mode listener", () => {
    const callback = jest.fn();
    electronAPI.addToggleDarkModeListener(callback);
    expect(ipcRenderer.on).toHaveBeenCalledWith("toggle-dark-mode", callback);
  });

  it("removes toggle dark mode listener", () => {
    electronAPI.removeToggleDarkModeListener();
    expect(ipcRenderer.removeAllListeners).toHaveBeenCalledWith("toggle-dark-mode");
  });

  it("adds error listener with valid callback", () => {
    const callback = jest.fn();
    electronAPI.addErrorListener(callback);

    const showErrorHandler = (ipcRenderer.on as jest.Mock).mock.calls.find(call => call[0] === "show-error")?.[1];

    expect(ipcRenderer.on).toHaveBeenCalledWith("show-error", expect.any(Function));

    if (showErrorHandler) {
      showErrorHandler({} as IpcRendererEvent, "Test Error");
      expect(callback).toHaveBeenCalledWith("Test Error");
    } else {
      throw new Error("show-error event handler not found");
    }
  });

  it("does not add error listener without valid callback", () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    electronAPI.addErrorListener(undefined);
    expect(consoleWarnSpy).toHaveBeenCalledWith("[ElectronAPI] addErrorListener called without a valid callback");
    consoleWarnSpy.mockRestore();
  });

  it("removes error listener", () => {
    electronAPI.removeErrorListener();
    expect(ipcRenderer.removeAllListeners).toHaveBeenCalledWith("show-error");
  });

  it("adds a generic event listener", () => {
    const callback = jest.fn();
    electronAPI.on("custom-event", callback);

    const customEventHandler = (ipcRenderer.on as jest.Mock).mock.calls.find(call => call[0] === "custom-event")?.[1];

    expect(ipcRenderer.on).toHaveBeenCalledWith("custom-event", expect.any(Function));

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
    expect(ipcRenderer.off).toHaveBeenCalledWith("custom-event", callback);
  });
});