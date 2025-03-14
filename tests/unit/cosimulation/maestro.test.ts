import { startMaestro, stopMaestro, startSimulation, getSimulationResult } from "../../../src/cosimulation/maestro";
import { getConfig } from "../../../src/utils/config";
import { setSessionId } from "../../../src/cosimulation/simulationContext";
import { mainWindow } from "../../../src/main";
import { handleError } from "../../../src/utils/errorHandler";
import { isPortInUse } from "../../../src/utils/processes/maestroUtils";
import * as fs from "fs";
import { spawn, ChildProcess } from "child_process";
import kill from "tree-kill";

jest.mock("../../../src/utils/config", () => ({
  getConfig: jest.fn(),
}));

jest.mock("../../../src/utils/errorHandler", () => ({
  handleError: jest.fn(),
}));

jest.mock("../../../src/utils/processes/maestroUtils", () => ({
  isPortInUse: jest.fn(),
  killProcessOnPort: jest.fn(),
}));

jest.mock("../../../src/electron/gui/menu", () => ({
  updateCosimulationMenu: jest.fn(),
}));

jest.mock("../../../src/main", () => ({
  mainWindow: {
    webContents: { send: jest.fn() },
  },
}));

jest.mock("../../../src/cosimulation/simulationContext", () => ({
  setSessionId: jest.fn(),
}));

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  copyFileSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock("child_process", () => ({
  spawn: jest.fn(),
}));

jest.mock("tree-kill", () => jest.fn());

global.fetch = jest.fn();

describe("Maestro Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("starts Maestro successfully", async () => {
    jest.setTimeout(5000);

    (getConfig as jest.Mock).mockReturnValue({
      tempMaestroJarPath: "/mock/path/to/tempMaestro.jar",
      maestroJarPath: "/mock/path/to/maestro.jar",
    });

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (isPortInUse as jest.Mock).mockResolvedValue(false);

    (spawn as jest.Mock).mockReturnValue({
      stdout: {
        on: jest.fn((event, callback) => {
          if (event === "data") {
            callback("Starting ProtocolHandler [http-nio-8082]");
          }
        }),
      },
      stderr: { on: jest.fn() },
      on: jest.fn(),
      unref: jest.fn(),
    } as unknown as ChildProcess);

    await startMaestro();
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mainWindow?.webContents.send).toHaveBeenCalledWith("simulation-status", "Maestro started.");
  });

  it("handles error when starting Maestro with missing config", async () => {
    (getConfig as jest.Mock).mockReturnValue(null);

    await expect(startMaestro()).rejects.toThrow("Configuration not set. Please select a project.");
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(handleError).toHaveBeenCalled();
  });

  it("stops Maestro successfully", async () => {
    const mockKill = kill as jest.Mock;
    mockKill.mockImplementation((pid, signal, callback) => callback(null));

    await stopMaestro();
    expect(mainWindow?.webContents.send).toHaveBeenCalledWith("simulation-status", "Idle");
  });

  it("starts simulation successfully", async () => {
    (getConfig as jest.Mock).mockReturnValue({
      simulationConfigPath: "/mock/path/experiment.json",
      multiModels: "/mock/path/multi-model.json",
      fmusPath: "/mock/path/fmus",
    });

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({}));

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ sessionId: "mock-session-id" }),
      text: jest.fn().mockResolvedValue(""),
    });

    await startSimulation();
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(setSessionId).toHaveBeenCalledWith("mock-session-id");
    expect(mainWindow?.webContents.send).toHaveBeenCalledWith("simulation-status", "Simulation completed.");
  });

  it("fetches simulation result successfully", async () => {
    (getConfig as jest.Mock).mockReturnValue({
      outputPath: "/mock/path/output",
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue("csv-data"),
    });

    (fs.writeFileSync as jest.Mock).mockImplementation();

    const resultPath = await getSimulationResult("mock-session-id");

    expect(resultPath).toBe("/mock/path/output/simulation-mock-session-id.csv");
    expect(fs.writeFileSync).toHaveBeenCalledWith("/mock/path/output/simulation-mock-session-id.csv", "csv-data");
  });
});
