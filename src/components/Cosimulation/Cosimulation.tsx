import React, { useEffect } from 'react';
import { Typography, Box } from '@mui/material';
import { useCosimulation } from './useCosimulation';
import SimulationGuide from '../SimulationGuide'; 

const CoSimulation: React.FC = () => {
  const { error, simulationStatus, resultsPath, setSimulationStatus } = useCosimulation();

  useEffect(() => {
    const handleSimulationStatus = (...args: unknown[]) => {
      const status = args[0] as string;
      console.log('[CoSimulation] Received simulation status:', status);
      setSimulationStatus(status);
    };

    window.electronAPI?.on('simulation-status', handleSimulationStatus);

    return () => {
      window.electronAPI?.off('simulation-status', handleSimulationStatus);
    };
  }, [setSimulationStatus]);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        CoSimulation
      </Typography>
      <Typography variant="subtitle1" color="primary">
        Simulation Status: {simulationStatus}
      </Typography>
      {resultsPath && (
        <Typography variant="body2" color="textSecondary">
          Results saved at: {resultsPath}
        </Typography>
      )}
      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}
      <SimulationGuide />
    </Box>
  );
};

export default CoSimulation;