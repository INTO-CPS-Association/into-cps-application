import React from "react";
import { render, screen } from "@testing-library/react";
import CoSimulation from "../../../../src/components/Cosimulation/Cosimulation";
import { useCosimulation } from "../../../../src/components/Cosimulation/useCosimulation";

jest.mock("../../../../src/components/Cosimulation/useCosimulation");

describe("CoSimulation component", () => {
  it("renders the title and simulation status", () => {
    (useCosimulation as jest.Mock).mockReturnValue({
      error: null,
      simulationStatus: "Running",
      resultsPath: null,
    });

    render(<CoSimulation />);

    expect(screen.getByText("CoSimulation")).toBeInTheDocument();
    expect(screen.getByText("Simulation Status: Running")).toBeInTheDocument();
  });

  it("displays an error message if there is an error", () => {
    (useCosimulation as jest.Mock).mockReturnValue({
      error: "Simulation failed",
      simulationStatus: "Failed",
      resultsPath: null,
    });

    render(<CoSimulation />);

    expect(screen.getByText("Simulation failed")).toBeInTheDocument();
  });

  it("displays the results path when available", () => {
    (useCosimulation as jest.Mock).mockReturnValue({
      error: null,
      simulationStatus: "Completed",
      resultsPath: "/path/to/results",
    });

    render(<CoSimulation />);

    expect(screen.getByText("Results saved at: /path/to/results")).toBeInTheDocument();
  });

  it('handles simulation-status events with a valid status', () => {
    const setSimulationStatus = jest.fn();
    (useCosimulation as jest.Mock).mockReturnValue({
      error: null,
      simulationStatus: 'Idle',
      resultsPath: null,
      setSimulationStatus,
    });

  (global as unknown as any).window = (global as unknown as any).window || {};
  (global as unknown as any).window.electronAPI = {
      on: (_event: string, cb: (...args: unknown[]) => void) => {
        cb('Simulating');
      },
      off: jest.fn(),
    };

    render(<CoSimulation />);

    expect(setSimulationStatus).toHaveBeenCalled();
  });

  it('handles simulation-status events with an unknown status (falls back to Idle)', () => {
    const setSimulationStatus = jest.fn();
    (useCosimulation as jest.Mock).mockReturnValue({
      error: null,
      simulationStatus: 'Idle',
      resultsPath: null,
      setSimulationStatus,
    });

  (global as unknown as any).window = (global as unknown as any).window || {};
  (global as unknown as any).window.electronAPI = {
      on: (_event: string, cb: (...args: unknown[]) => void) => {
        cb('UNKNOWN_STATUS');
      },
      off: jest.fn(),
    };

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    render(<CoSimulation />);
    expect(setSimulationStatus).toHaveBeenCalledWith(expect.any(String));
    warnSpy.mockRestore();
  });
});
