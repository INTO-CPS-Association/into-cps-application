import { renderHook, act } from "@testing-library/react";
import { useCosimulation } from "../../../../src/components/Cosimulation/useCosimulation";

describe("useCosimulation hook", () => {
  let statusCallback: ((event: unknown, status: string) => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();

    window.cosimulationAPI.onSimulationStatus = jest.fn((callback) => {
      statusCallback = callback;
    });
  });

  it("updates simulation status when status changes", async () => {
    const { result } = renderHook(() => useCosimulation());

    act(() => {
      statusCallback?.({}, "Running");
    });

    expect(result.current.simulationStatus).toBe("Running");
  });

  it("fetches results on simulation completion", async () => {
    const { result } = renderHook(() => useCosimulation());

    act(() => {
      statusCallback?.({}, "Simulation completed.");
    });

    await act(async () => {
      await new Promise((res) => setTimeout(res, 100));
    });

    expect(result.current.resultsPath).toBe("/mock/path");
  });
});
