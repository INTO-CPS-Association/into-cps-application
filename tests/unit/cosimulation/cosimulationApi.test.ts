import { cosimulationAPI } from "../../../src/cosimulation/cosimulationApi";
import { ipcRenderer } from "electron";

jest.mock("electron", () => ({
  ipcRenderer: {
    invoke: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  },
}));

describe("cosimulationAPI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls maestro with correct arguments", async () => {
    await cosimulationAPI.maestro({ type: "start" });
    expect(ipcRenderer.invoke).toHaveBeenCalledWith("maestro", { type: "start" });
  });

  it("registers a simulation status listener", () => {
    const callback = jest.fn();
    cosimulationAPI.onSimulationStatus(callback);
    expect(ipcRenderer.on).toHaveBeenCalledWith("simulation-status", callback);
  });

  it("removes a simulation status listener", () => {
    const callback = jest.fn();
    cosimulationAPI.removeSimulationStatusListener(callback);
    expect(ipcRenderer.off).toHaveBeenCalledWith("simulation-status", callback);
  });

  it("registers a COE error listener", () => {
    const callback = jest.fn();
    cosimulationAPI.addCoeErrorListener(callback);
    expect(ipcRenderer.on).toHaveBeenCalledWith("coe-error", expect.any(Function));
  });

  it("removes all COE error listeners", () => {
    cosimulationAPI.removeCoeErrorListener();
    expect(ipcRenderer.removeAllListeners).toHaveBeenCalledWith("coe-error");
  });

  it("registers a COE reset listener", () => {
    const callback = jest.fn();
    cosimulationAPI.addCoeResetListener(callback);
    expect(ipcRenderer.on).toHaveBeenCalledWith("coe-reset", callback);
  });

  it("removes all COE reset listeners", () => {
    cosimulationAPI.removeCoeResetListener();
    expect(ipcRenderer.removeAllListeners).toHaveBeenCalledWith("coe-reset");
  });

  it("registers a custom event listener", () => {
    const callback = jest.fn();
    cosimulationAPI.on("custom-event", callback);
    expect(ipcRenderer.on).toHaveBeenCalledWith("custom-event", expect.any(Function));
  });

  it("removes a custom event listener", () => {
    const callback = jest.fn();
    cosimulationAPI.off("custom-event", callback);
    expect(ipcRenderer.off).toHaveBeenCalledWith("custom-event", callback);
  });

  it("retrieves session ID", async () => {
    (ipcRenderer.invoke as jest.Mock).mockResolvedValue("mock-session-id");
    const sessionId = await cosimulationAPI.getSessionId();
    expect(sessionId).toBe("mock-session-id");
    expect(ipcRenderer.invoke).toHaveBeenCalledWith("get-session-id");
  });
});