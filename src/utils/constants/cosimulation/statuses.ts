/**
 * Simulation statuses and Maestro notifications
 * Enum-like objects for consistent usage across the app
 */

// -------------------- Simulation Status --------------------
export const SimulationStatus = {
    Idle: 'Idle',
    StartingSimulation: 'Starting simulation...',
    Started: 'Simulation started',
    Simulating: 'Simulating...',
    SimulationCompleted: 'Simulation completed.',
    SimulationFailed: 'Simulation failed.',
    FetchFailedSimulationError: 'Fetch Failed. Please start Maestro before launching the cosimulation.',
    SimulationAlreadyInProgress: 'Simulation request already in progress',
} as const;
export type SimulationStatusType = typeof SimulationStatus[keyof typeof SimulationStatus];

// -------------------- Maestro Notifications --------------------
export const MaestroNotifications = {
    Status: {
        StartingMaestro: 'Starting Maestro...',
        StoppingMaestro: 'Stopping Maestro...',
        MaestroStarted: 'Maestro started successfully.',
        MaestroStopped: 'Maestro stopped successfully.',
        MaestroStoppedBeforeReady: 'Maestro process terminated before the server was ready. Please wait until Maestro is fully initialized.',
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
