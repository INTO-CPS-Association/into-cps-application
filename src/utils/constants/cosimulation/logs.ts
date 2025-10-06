/**
 * Log messages related to CoSimulation
 */
export const CosimulationLogs = {
    ReceivedStatus: (status: string) => `[CoSimulation] Received simulation status: ${status}`,
} as const;
