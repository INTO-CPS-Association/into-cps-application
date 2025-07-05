import { useState, useEffect } from 'react';
import { SimulationStatus } from '../../utils/constants/cosimulation/statuses';

export const useCosimulation = () => {
  const [error, setError] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<string>('Idle');
  const [resultsPath, setResultsPath] = useState<string | null>(null);

  useEffect(() => {
    const handleStatusUpdate = async (_: unknown, status: string) => {      
      setSimulationStatus(status);

      if (status === SimulationStatus.StartingSimulation) {
        setResultsPath(null);
        setError(null);
      }

      if (status === SimulationStatus.Started) {
        setResultsPath(null);
      }

      if (status === SimulationStatus.SimulationCompleted) {
        try {
          const latestResultPath = await window?.cosimulationAPI?.getLatestResultFolder();
          if (!latestResultPath) {
            throw new Error('No recent simulation result folder found.');
          }
          setResultsPath(latestResultPath);
        } catch (err) {
          console.error('[useCosimulation] Error getting results folder:', err);
          setError('Failed to find simulation results.');
        }
      }
    };

    const handleCoeError = (_: unknown, errorMessage: string) => {
      setError(errorMessage);
    };

    const handleCoeReset = () => {
      setSimulationStatus('Idle');
      setResultsPath(null);
      setError(null);
    };

    window.cosimulationAPI?.onSimulationStatus(handleStatusUpdate);
    window.cosimulationAPI?.addCoeErrorListener(handleCoeError);
    window.electronAPI?.on('reset-simulation-state', handleCoeReset);

    return () => {
      window.cosimulationAPI?.removeSimulationStatusListener(handleStatusUpdate);
      window.cosimulationAPI?.removeCoeErrorListener();
      window.electronAPI?.off('reset-simulation-state', handleCoeReset);
    };
  }, []);

  return { error, simulationStatus, resultsPath };
};
