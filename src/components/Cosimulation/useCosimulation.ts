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
          const sessionId = await window?.cosimulationAPI?.getSessionId();
          if (!sessionId) {
            throw new Error('Session ID is not available.');
          }

          const resultPath = await window?.cosimulationAPI?.maestro({
            type: 'get-result',
            data: { sessionId },
          });

          if (resultPath?.success) {
            setResultsPath(resultPath.resultPath || null);
          } else {
            throw new Error(resultPath?.error || 'Failed to fetch simulation results.');
          }
        } catch (err) {
          console.error('[useCosimulation] Error fetching simulation results:', err);
          setError('Failed to fetch simulation results.');
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
