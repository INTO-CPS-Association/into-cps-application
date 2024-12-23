import { useState, useEffect } from 'react';

export const useCosimulation = () => {
  const [error, setError] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<string>('Idle');
  const [resultsPath, setResultsPath] = useState<string | null>(null);

  useEffect(() => {
    const handleStatusUpdate = async (event: unknown, status: string) => {
      setSimulationStatus(status);

      if (status === 'Simulation completed.') {
        try {
          const sessionId = await window?.electronAPI?.getSessionId();
          if (!sessionId) {
            throw new Error('Session ID is not available.');
          }

          const resultPath =
            await window?.electronAPI?.getSimulationResult(sessionId);
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
      console.log('Resetting simulation states due to COE restart.');
      setSimulationStatus('Idle');
      setResultsPath(null);
      setError(null);
    };

    window.electronAPI?.onSimulationStatus(handleStatusUpdate);
    window.electronAPI?.addCoeErrorListener(handleCoeError);
    window.electronAPI?.addCoeResetListener(handleCoeReset);

    return () => {
      window.electronAPI?.removeSimulationStatusListener(handleStatusUpdate);
      window.electronAPI?.removeCoeErrorListener();
      window.electronAPI?.removeCoeResetListener();
    };
  }, []);

  return { error, simulationStatus, resultsPath };
};