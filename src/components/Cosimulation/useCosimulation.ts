import { useState, useEffect } from 'react';
import { SimulationStatus, SimulationStatusType, CosimulationErrors, GlobalErrors } from "../../utils/constants";

export const useCosimulation = () => {
  const [error, setError] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatusType>(SimulationStatus.Idle);
  const [resultsPath, setResultsPath] = useState<string | null>(null);

  useEffect(() => {
    const handleStatusUpdate = async (_: unknown, status: string) => {
      if (Object.values(SimulationStatus).includes(status as SimulationStatusType)) {
        const typedStatus = status as SimulationStatusType;

        setSimulationStatus(typedStatus);

        if (typedStatus === SimulationStatus.StartingSimulation) {
          setResultsPath(null);
          setError(null);
        }

        if (typedStatus === SimulationStatus.Started) {
          setResultsPath(null);
        }

        if (typedStatus === SimulationStatus.SimulationCompleted) {
          try {
            const latestResultPath = await window?.cosimulationAPI?.getLatestResultFolder();
            if (!latestResultPath) {
              throw new Error(CosimulationErrors.NoResultsFolder);
            }
            setResultsPath(latestResultPath);
          } catch (err) {
            console.error("[useCosimulation]", CosimulationErrors.FailedToFindResults, err);
            setError(CosimulationErrors.FailedToFindResults);
          }
        } else {
          console.warn("[useCosimulation]", CosimulationErrors.UnknownStatus, status);
          setError(GlobalErrors.Unknown);
        }
      };

      const handleCoeError = (_: unknown, errorMessage: string) => {
        setError(errorMessage);
      };

      const handleCoeReset = () => {
        setSimulationStatus(SimulationStatus.Idle);
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
    }
  }, []);

  return { error, simulationStatus, resultsPath, setSimulationStatus };
};
