import { renderHook, act, waitFor } from "@testing-library/react";
import { useCosimulation } from "../../../../src/components/Cosimulation/useCosimulation";
import { SimulationStatus } from "../../../../src/utils/constants/cosimulation/statuses";
import type { SimulationStatusType } from "../../../../src/utils/constants/cosimulation/statuses";

describe("useCosimulation hook", () => {
  let statusCallback: ((event: unknown, status: string) => void) | undefined;
  let errorCallback: ((_: unknown, msg: string) => void) | undefined;
  let resetCallback: (() => void) | undefined;

  beforeEach(() => {
    // @ts-expect-error: mocking global cosimulationAPI in test environment
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

    // @ts-expect-error: mocking global electronAPI in test environment
    window.electronAPI = {
      on: jest.fn((event, cb) => {
        if (event === 'reset-simulation-state') {
          resetCallback = cb;
        }
      }),
      off: jest.fn(),
    };
  });

  const callStatus = (status: string) => {
    const cb = statusCallback ?? (window.cosimulationAPI.onSimulationStatus as jest.Mock).mock.calls[0]?.[0];
    cb?.({}, status);
  };

  const callError = (msg: string) => {
    const cb = errorCallback ?? (window.cosimulationAPI.addCoeErrorListener as jest.Mock).mock.calls[0]?.[0];
    cb?.({}, msg);
  };

  const callReset = () => {
    const cb = resetCallback ?? (window.electronAPI.on as jest.Mock).mock.calls.find(c => c[0] === 'reset-simulation-state')?.[1];
    cb?.();
  };

  it("updates simulation status when status changes", async () => {
    const { result } = renderHook(() => useCosimulation());

    act(() => {
      const running = "Running" as unknown as SimulationStatusType;
      result.current.setSimulationStatus(running);
    });

    expect(result.current.simulationStatus).toBe("Running");
  });

  it("resets error and resultsPath on StartingSimulation", async () => {
    const { result } = renderHook(() => useCosimulation());

    await waitFor(() => expect((window.cosimulationAPI.onSimulationStatus as jest.Mock).mock.calls.length).toBeGreaterThan(0));

    act(() => {
      callStatus(SimulationStatus.StartingSimulation);
    });

    expect(result.current.simulationStatus).toBe(SimulationStatus.StartingSimulation);
    expect(result.current.resultsPath).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("clears resultsPath on Started status", async () => {
    const { result } = renderHook(() => useCosimulation());

    await waitFor(() => expect((window.cosimulationAPI.onSimulationStatus as jest.Mock).mock.calls.length).toBeGreaterThan(0));

    act(() => {
      callStatus(SimulationStatus.Started);
    });

    expect(result.current.simulationStatus).toBe(SimulationStatus.Started);
    expect(result.current.resultsPath).toBeNull();
  });

  it("fetches results on simulation completion", async () => {
    const { result } = renderHook(() => useCosimulation());

    await waitFor(() => expect((window.cosimulationAPI.onSimulationStatus as jest.Mock).mock.calls.length).toBeGreaterThan(0));

    act(() => {
      callStatus(SimulationStatus.SimulationCompleted);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.resultsPath).toBe("/mock/path");
  });

  it("handles missing results path gracefully", async () => {
    window.cosimulationAPI.getLatestResultFolder = jest.fn().mockResolvedValue(null);

    const { result } = renderHook(() => useCosimulation());

    await waitFor(() => expect((window.cosimulationAPI.onSimulationStatus as jest.Mock).mock.calls.length).toBeGreaterThan(0));

    act(() => {
      callStatus(SimulationStatus.SimulationCompleted);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe("Failed to find simulation results.");
  });

  it("handles COE error and reset events", async () => {
    const { result } = renderHook(() => useCosimulation());

    await waitFor(() => expect((window.cosimulationAPI.addCoeErrorListener as jest.Mock).mock.calls.length).toBeGreaterThan(0));
    await waitFor(() => expect((window.electronAPI.on as jest.Mock).mock.calls.length).toBeGreaterThan(0));

    act(() => {
      callError("Fatal error");
    });

    expect(result.current.error).toBe("Fatal error");

    act(() => {
      callReset();
    });

    expect(result.current.simulationStatus).toBe("Idle");
    expect(result.current.resultsPath).toBeNull();
    expect(result.current.error).toBeNull();
  });
});