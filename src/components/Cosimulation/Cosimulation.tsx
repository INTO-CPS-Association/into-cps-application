import React, { useEffect } from 'react';
import { Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useCosimulation } from './useCosimulation';
import { useProject } from '../../contexts/ProjectContext';
import SimulationGuide from '../SimulationGuide';

import { LABELS, PAGETITLES, SimulationStatus, SimulationStatusType, GlobalErrors, CosimulationErrors, CosimulationLogs } from "../../utils/constants";

const CoSimulation: React.FC = () => {
  const { error, simulationStatus, resultsPath, setSimulationStatus } = useCosimulation();
  const { projectPath } = useProject();
  const theme = useTheme();

  useEffect(() => {
    const handleSimulationStatus = (...args: unknown[]) => {
      const status = args[0] as string;
      console.log(CosimulationLogs.ReceivedStatus(status));

      if (Object.values(SimulationStatus).includes(status as SimulationStatusType)) {
        setSimulationStatus(status as SimulationStatusType);
      } else {
        console.warn("[CoSimulation]", CosimulationErrors.UnknownStatus, status);
        setSimulationStatus(SimulationStatus.Idle);
      }
    };

    window.electronAPI?.on('simulation-status', handleSimulationStatus);
    return () => {
      window.electronAPI?.off('simulation-status', handleSimulationStatus);
    };
  }, [setSimulationStatus]);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {PAGETITLES.CoSimulation}
      </Typography>
      {projectPath && (
        <Box mb={3}>
           <Typography variant="h6" color={theme.palette.text.primary}>
             Current Project
           </Typography>
           <Typography variant="body1" color={theme.palette.text.secondary} sx={{ fontFamily: 'monospace', bgcolor: theme.palette.action.hover, p: 1, borderRadius: 1 }}>
             {projectPath}
           </Typography>
        </Box>
      )}
      <Typography variant="subtitle1" color={theme.palette.text.primary}>
        {LABELS.CoSimulation.Status} {simulationStatus}
      </Typography>
      {resultsPath && (
        <Typography variant="body2" color={theme.palette.text.secondary}>
          {LABELS.CoSimulation.Results} {resultsPath}
        </Typography>
      )}
      {error && (
        <Typography variant="body2" color={theme.palette.error.main}>
          {error || GlobalErrors.Unknown}
        </Typography>
      )}
      <SimulationGuide />
    </Box>
  );
};

export default CoSimulation;