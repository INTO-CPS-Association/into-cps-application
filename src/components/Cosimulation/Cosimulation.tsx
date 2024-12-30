import React from 'react';
import { Typography, Box } from '@mui/material';
import { useCosimulation } from './useCosimulation';

const CoSimulation: React.FC = () => {
  const { error, simulationStatus, resultsPath } = useCosimulation();

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
    </Box>
  );
};

export default CoSimulation;