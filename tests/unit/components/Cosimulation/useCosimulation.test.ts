import { renderHook, act } from "@testing-library/react";
import { useCosimulation } from "../../../../src/components/Cosimulation/useCosimulation";
import { SimulationStatus } from "../../../../src/utils/constants/cosimulation/statuses";

describe("useCosimulation hook", () => {
  let statusCallback: ((event: unknown, status: string) => void) | undefined;
  let errorCallback: ((_: unknown, msg: string) => void) | undefined;
  let resetCallback: (() => void) | undefined;

  beforeEach(() => {
    // @ts-ignore
    window.cosimulationAPI = {
      onSimulationStatus: jest.fn(cb => {
        statusCallback = cb;
      }),
      addCoeErrorListener: jest.fn(cb => {
        errorCallback = cb;
      }),
      getLatestResultFolder: jest.fn().mockResolvedValue('/mock/path'),
      removeSimulationStatusListener: jest.fn(),
      removeCoeErrorListener: jest.fn(),
    };

    // @ts-ignore
    window.electronAPI = {
      on: jest.fn((event, cb) => {
        if (event === 'reset-simulation-state') {
          resetCallback = cb;
        }
      }),
      off: jest.fn(),
    };
  });

  it("updates simulation status when status changes", () => {
    const { result } = renderHook(() => useCosimulation());

    act(() => {
      statusCallback?.({}, "Running");
    });

    expect(result.current.simulationStatus).toBe("Running");
  });

  it("resets error and resultsPath on StartingSimulation", () => {
    const { result } = renderHook(() => useCosimulation());

    act(() => {
      statusCallback?.({}, SimulationStatus.StartingSimulation);
    });

    expect(result.current.simulationStatus).toBe(SimulationStatus.StartingSimulation);
    expect(result.current.resultsPath).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("clears resultsPath on Started status", () => {
    const { result } = renderHook(() => useCosimulation());

    act(() => {
      statusCallback?.({}, SimulationStatus.Started);
    });

    expect(result.current.simulationStatus).toBe(SimulationStatus.Started);
    expect(result.current.resultsPath).toBeNull();
  });

  it("fetches results on simulation completion", async () => {
    const { result } = renderHook(() => useCosimulation());

    act(() => {
      statusCallback?.({}, SimulationStatus.SimulationCompleted);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.resultsPath).toBe("/mock/path");
  });

  it("handles missing results path gracefully", async () => {
    // @ts-ignore
    window.cosimulationAPI.getLatestResultFolder = jest.fn().mockResolvedValue(null);

    const { result } = renderHook(() => useCosimulation());

    act(() => {
      statusCallback?.({}, SimulationStatus.SimulationCompleted);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe("Failed to find simulation results.");
  });

  it("handles COE error and reset events", () => {
    const { result } = renderHook(() => useCosimulation());

    act(() => {
      errorCallback?.({}, "Errore fatale");
    });

    expect(result.current.error).toBe("Errore fatale");

    act(() => {
      resetCallback?.();
    });

    expect(result.current.simulationStatus).toBe("Idle");
    expect(result.current.resultsPath).toBeNull();
    expect(result.current.error).toBeNull();
  });
});