/**
 * Enum-like object representing the various statuses of a simulation.
 */
export const SimulationStatus = {
    Idle: 'Idle',
    StartingSimulation: 'Starting simulation...',
    Started: 'Simulation started',
    Simulating: 'Simulating...',
    SimulationCompleted: 'Simulation completed.',
    SimulationFailed: 'Simulation failed: ',
    FetchFailedSimulationError: 'Typer Error: Fetch Failed.',
    SimulationAlreadyInProgress: 'Simulation request already in progress',
} as const;

export const MaestroNotifications = {
    Status: {
        StartingMaestro: 'Starting Maestro...',
        StoppingMaestro: 'Stopping Maestro...',
        MaestroStarted: 'Maestro started successfully.',
        MaestroStopped: 'Maestro stopped successfully.',
        MaestroStoppedBeforeReady: 'Maestro process closed before server was ready.',
        MaestroJarExtracted: 'Maestro JAR already extracted.',
        MaestroServerReady: 'Maestro server is ready.',
    },

    Error: {
        MaestroJarNotFound: 'Maestro JAR not found. Please ensure it is installed correctly.',
        PortInUse: (port: number) => 
            `Port ${port} is already in use. Attempting to close conflicting process...`,
        JavaNotConfigured: 'Java not found or misconfigured. Please check your Java installation.',
        GenericStartupError: 'Maestro encountered an error during startup.',
        ConfigurationNotSet: 'Maestro configuration not set. Please set the Maestro path in the settings.',
    }
} as const;
