import { useState, useEffect } from 'react';

export const useCosimulation = () => {
  const [error, setError] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<string>('Idle');
  const [resultsPath, setResultsPath] = useState<string | null>(null);

  const startSimulation = async () => {
    try {
      const response = await window?.cosimulationAPI?.maestro('start-simulation');

      if (response?.success) {
        setSimulationStatus('Simulating...');
      } else {
        setError(response?.error || 'Failed to start simulation.');
      }
    } catch (err) {
      setError('An unexpected error occurred while starting the simulation.');
      console.error(err);
    }
  };

  useEffect(() => {
    const handleStatusUpdate = async (event: unknown, status: string) => {
      setSimulationStatus(status);

      if (status === 'Simulation completed.') {
        try {
          const sessionId = await window?.cosimulationAPI?.getSessionId();
          if (!sessionId) {
            throw new Error('Session ID is not available.');
          }

          const resultPath = await window?.cosimulationAPI?.getSimulationResult(sessionId);
          setResultsPath(resultPath || null);
        } catch (err) {
          console.error('Error fetching simulation results:', err);
          setError('Failed to fetch simulation results.');
        }
      }
    };

    const handleCoeError = (event: unknown, errorMessage: string) => {
      console.error('COE Error:', errorMessage);
      setError(errorMessage);
    };

    const handleCoeReset = () => {
      setSimulationStatus('Idle');
      setResultsPath(null);
      setError(null);
    };

    window.cosimulationAPI?.onSimulationStatus(handleStatusUpdate);
    window.cosimulationAPI?.addCoeErrorListener(handleCoeError);
    window.cosimulationAPI?.addCoeResetListener(handleCoeReset);

    return () => {
      window.cosimulationAPI?.removeSimulationStatusListener(handleStatusUpdate);
      window.cosimulationAPI?.removeCoeErrorListener();
      window.cosimulationAPI?.removeCoeResetListener();
    };
  }, []);

  return { error, simulationStatus, resultsPath, startSimulation };
};
