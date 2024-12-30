/**
 * Enum-like object representing the various statuses of a simulation.
 */
export const SimulationStatus = {
    Idle: 'Idle',
    StartingSimulation: 'Starting simulation...',
    Simulating: 'Simulating...',
    SimulationCompleted: 'Simulation completed.',
    SimulationFailed: 'Simulation failed: ',
    FetchFailed: 'Fetch Failed. Please start Maestro before launching the cosimulation.',
} as const;

export const MaestroStatus = {
    StartingMaestro: 'Starting Maestro...',
    StoppingMaestro: 'Stopping Maestro...',
    MaestroStarted: 'Maestro started successfully.',
    MaestroStopped: 'Maestro stopped successfully.',
    MaestroStoppedBeforeReady: 'Maestro process closed before server was ready.',
    MaestroJarNotFound: 'Maestro JAR not found. Please ensure it is installed correctly.',
    MaestroJarExtracted: 'Maestro JAR already extracted.',
    PortInUse: (port: number) =>
        `Port ${port} is already in use. Attempting to close conflicting process...`,
    MaestroServerReady: 'Maestro server is ready.',
    JavaNotConfigured: 'Java not found or misconfigured. Please check your Java installation.',
    GenericStartupError: 'Maestro encountered an error during startup.',
} as const;
