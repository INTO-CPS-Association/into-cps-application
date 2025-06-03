import { SimulationStatus, MaestroNotifications } from "../../../../../src/utils/constants/cosimulation/statuses";

describe('SimulationStatus', () => {
  it('should contain correct simulation statuses', () => {
    expect(SimulationStatus.Idle).toBe('Idle');
    expect(SimulationStatus.StartingSimulation).toBe('Starting simulation...');
    expect(SimulationStatus.Simulating).toBe('Simulating...');
    expect(SimulationStatus.SimulationCompleted).toBe('Simulation completed.');
    expect(SimulationStatus.SimulationFailed).toBe('Simulation failed. ');
    expect(SimulationStatus.FetchFailedSimulationError).toBe(
      'Fetch Failed. Please start Maestro before launching the cosimulation.'
    );
  });
});

describe('MaestroStatus', () => {
  it('should contain correct maestro statuses', () => {
    expect(MaestroNotifications.Status.StartingMaestro).toBe('Starting Maestro...');
    expect(MaestroNotifications.Status.StoppingMaestro).toBe('Stopping Maestro...');
    expect(MaestroNotifications.Status.MaestroStarted).toBe('Maestro started successfully.');
    expect(MaestroNotifications.Status.MaestroStopped).toBe('Maestro stopped successfully.');
    expect(MaestroNotifications.Status.MaestroStoppedBeforeReady).toBe(
      'Maestro process terminated before the server was ready. Please wait until Maestro is fully initialized.'
    );
    expect(MaestroNotifications.Error.MaestroJarNotFound).toBe(
      'Maestro JAR not found. Please ensure it is installed correctly.'
    );
    expect(MaestroNotifications.Status.MaestroJarExtracted).toBe('Maestro JAR already extracted.');
    expect(MaestroNotifications.Status.MaestroServerReady).toBe('Maestro server is ready.');
    expect(MaestroNotifications.Error.JavaNotConfigured).toBe(
      'Java not found or misconfigured. Please check your Java installation.'
    );
    expect(MaestroNotifications.Error.GenericStartupError).toBe(
      'Maestro encountered an error during startup.'
    );
  });

  it('should correctly generate port in use message', () => {
    expect(MaestroNotifications.Error.PortInUse(8080)).toBe(
      'Port 8080 is already in use. Attempting to close conflicting process...'
    );
    expect(MaestroNotifications.Error.PortInUse(3000)).toBe(
      'Port 3000 is already in use. Attempting to close conflicting process...'
    );
  });
});