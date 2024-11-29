const COE_API_BASE_URL = "http://localhost:8082";

/**
 * Create a simulation on the COE.
 * @param simulationConfig - Configuration of the simulation.
 * @returns Simulation ID of the created simulation.
 */
export const createSimulation = async (simulationConfig: object): Promise<string> => {
  const response = await fetch(`${COE_API_BASE_URL}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(simulationConfig),
  });

  if (!response.ok) {
    throw new Error(`Error creating simulation: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Simulation created:", data);
  return data.simulationId;
};

/**
 * Start a simulation on the COE.
 * @param simulationId - ID of the simulation to start.
 */
export const startSimulation = async (simulationId: string): Promise<void> => {
  const response = await fetch(`${COE_API_BASE_URL}/start/${simulationId}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Error starting simulation: ${response.statusText}`);
  }

  console.log("Simulation started successfully.");
};

/**
 * Retrieve the status of a simulation.
 * @param simulationId - ID of the simulation.
 * @returns The status of the simulation.
 */
export const getSimulationStatus = async (simulationId: string): Promise<object> => {
  const response = await fetch(`${COE_API_BASE_URL}/status/${simulationId}`);

  if (!response.ok) {
    throw new Error(`Error fetching simulation status: ${response.statusText}`);
  }

  const status = await response.json();
  console.log("Simulation status:", status);
  return status;
};