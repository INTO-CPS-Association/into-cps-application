import { useState, useEffect } from 'react';

export const useCosimulation = () => {
  const [error, setError] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<string>('Idle');
  const [resultsPath, setResultsPath] = useState<string | null>(null);

  useEffect(() => {
    const handleStatusUpdate = async (_: unknown, status: string) => {
      setSimulationStatus(status);
      if (status === 'Simulation completed.') {
        try {
          const sessionId = await window?.cosimulationAPI?.getSessionId();
          console.log("sessionId", sessionId);
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

  return { error, simulationStatus, resultsPath };
};