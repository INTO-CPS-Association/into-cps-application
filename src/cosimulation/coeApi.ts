import * as fs from 'fs';
import * as path from 'path';
import { configCoe } from '../utils/config';

const { outputPath } = configCoe;

const COE_API_BASE_URL = "http://localhost:8082";

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

export const startSimulation = async (simulationId: string): Promise<void> => {
  const response = await fetch(`${COE_API_BASE_URL}/start/${simulationId}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Error starting simulation: ${response.statusText}`);
  }

  console.log("Simulation started successfully.");
};

export const getSimulationStatus = async (simulationId: string): Promise<object> => {
  const response = await fetch(`${COE_API_BASE_URL}/status/${simulationId}`);

  if (!response.ok) {
    throw new Error(`Error fetching simulation status: ${response.statusText}`);
  }

  const status = await response.json();
  console.log("Simulation status:", status);
  return status;
};

export const saveSimulationResults = (data: object) => {
  const resultPath = path.join(outputPath, 'simulation-results.json');
  try {
    fs.writeFileSync(resultPath, JSON.stringify(data, null, 2));
    console.log('Results saved to:', resultPath);
  } catch (error) {
    console.error('Error saving results:', error);
  }
};