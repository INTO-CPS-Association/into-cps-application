// import React, { useEffect } from 'react';
// import { Typography, Box, IconButton, Tooltip } from '@mui/material';
// import { useTheme } from '@mui/material/styles';
// import FolderOpenIcon from '@mui/icons-material/FolderOpen'; 

// import { useCosimulation } from './useCosimulation';
// import { useProject } from '../../contexts/ProjectContext';
// import SimulationGuide from '../SimulationGuide';

// import { LABELS, PAGETITLES, SimulationStatus, SimulationStatusType, GlobalErrors, CosimulationErrors, CosimulationLogs } from "../../utils/constants";

// const CoSimulation: React.FC = () => {
//   const { error, simulationStatus, resultsPath, setSimulationStatus } = useCosimulation();
//   const { projectPath } = useProject();
//   const theme = useTheme();

//   useEffect(() => {
//     const handleSimulationStatus = (...args: unknown[]) => {
//       const status = args[0] as string;
//       console.log(CosimulationLogs.ReceivedStatus(status));

//       if (Object.values(SimulationStatus).includes(status as SimulationStatusType)) {
//         setSimulationStatus(status as SimulationStatusType);
//       } else {
//         console.warn("[CoSimulation]", CosimulationErrors.UnknownStatus, status);
//         setSimulationStatus(SimulationStatus.Idle);
//       }
//     };

//     window.electronAPI?.on('simulation-status', handleSimulationStatus);
//     return () => {
//       window.electronAPI?.off('simulation-status', handleSimulationStatus);
//     };
//   }, [setSimulationStatus]);

//   const handleOpenProjectFolder = async () => {
//      if (projectPath) await window.electronAPI.openFolder(projectPath);
//   };

//   const handleOpenResultsFolder = async () => {
//      if (resultsPath) await window.electronAPI.openFolder(resultsPath);
//   };

//   return (
//     <Box>
//       <Typography variant="h4" component="h1" gutterBottom>
//         {PAGETITLES.CoSimulation}
//       </Typography>
      
//       <Typography variant="subtitle1" color={theme.palette.text.primary}>
//         {LABELS.CoSimulation.Status} {simulationStatus}
//       </Typography>

//       {projectPath && (
//         <Box mb={3}>
//            <Typography variant="subtitle1" color={theme.palette.text.primary}>
//               {LABELS.CoSimulation.CurrentProject}
//            </Typography>
           
//            <Box 
//              sx={{ 
//                display: 'flex', 
//                alignItems: 'center', 
//                justifyContent: 'space-between',
//                fontFamily: 'monospace', 
//                bgcolor: theme.palette.action.hover, 
//                p: 1, 
//                borderRadius: 1 
//              }}
//             >
//              <Typography variant="body1" sx={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>
//                {projectPath}
//              </Typography>
             
//              <Tooltip title="Open in Explorer">
//                <IconButton onClick={handleOpenProjectFolder} size="small" color="primary">
//                  <FolderOpenIcon />
//                </IconButton>
//              </Tooltip>
//            </Box>
//         </Box>
//       )}

//       {resultsPath && (
//         <Box mt={2}>
//            <Typography variant="body2" color={theme.palette.text.secondary}>
//              {LABELS.CoSimulation.Results}
//            </Typography>
           
//            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//              <Typography variant="body2" color={theme.palette.text.secondary} sx={{ fontFamily: 'monospace' }}>
//                 {resultsPath}
//              </Typography>
//              <Tooltip title="Open Results Folder">
//                 <IconButton onClick={handleOpenResultsFolder} size="small">
//                   <FolderOpenIcon fontSize="small" />
//                 </IconButton>
//              </Tooltip>
//            </Box>
//         </Box>
//       )}

//       {error && (
//         <Typography variant="body2" color={theme.palette.error.main} sx={{ mt: 2 }}>
//           {error || GlobalErrors.Unknown}
//         </Typography>
//       )}
      
//       <SimulationGuide />
//     </Box>
//   );
// };

// export default CoSimulation;

import React, { useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Chip, 
  Stack, 
  Paper, 
  IconButton, 
  Tooltip, 
  Container 
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FolderOpenIcon from '@mui/icons-material/FolderOpen'; // Assicurati di averlo
import CircleIcon from '@mui/icons-material/Circle'; // Per il pallino di stato

import { useCosimulation } from './useCosimulation';
import { useProject } from '../../contexts/ProjectContext';
import SimulationGuide from '../SimulationGuide';

import { 
  LABELS, 
  PAGETITLES, 
  SimulationStatus, 
  SimulationStatusType, 
  GlobalErrors, 
  CosimulationErrors, 
  CosimulationLogs 
} from "../../utils/constants";

const CoSimulation: React.FC = () => {
  const { error, simulationStatus, resultsPath, setSimulationStatus } = useCosimulation();
  const { projectPath } = useProject();
  const theme = useTheme();

  // --- Handlers ---
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

  const handleOpenProjectFolder = async () => {
     if (projectPath) await window.electronAPI.openFolder(projectPath);
  };

  const handleOpenResultsFolder = async () => {
     if (resultsPath) await window.electronAPI.openFolder(resultsPath);
  };

  // --- Helpers per UI ---
  // Definiamo il colore dello stato in base al valore
  const getStatusColor = (status: SimulationStatusType) => {
    // if (status === SimulationStatus.Error || status === SimulationStatus.SimulationFailed) return 'error';
    if (status === SimulationStatus.SimulationCompleted) return 'success';
    if (status === SimulationStatus.StartingSimulation) return 'info'; // o 'info'
    return 'default'; // Idle
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      
      {/* 1. HEADER & STATUS */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="500">
          {PAGETITLES.CoSimulation}
        </Typography>

        <Chip 
          icon={<CircleIcon sx={{ fontSize: '10px !important' }} />}
          label={simulationStatus}
          color={getStatusColor(simulationStatus as SimulationStatusType)}
          variant="outlined"
          sx={{ fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}
        />
      </Box>

      <Stack spacing={3}>
        
        {/* 2. PROJECT CARD (Selezionato) */}
        {projectPath ? (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              bgcolor: theme.palette.background.paper 
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box overflow="hidden" mr={2}>
                <Typography variant="overline" color="text.secondary" display="block" lineHeight={1}>
                   {LABELS.CoSimulation.CurrentProject || "Current Project"}
                </Typography>
                <Tooltip title={projectPath}>
                  <Typography variant="body1" noWrap sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                    {projectPath}
                  </Typography>
                </Tooltip>
              </Box>
              <Tooltip title="Open in Explorer">
                <IconButton onClick={handleOpenProjectFolder} color="primary">
                  <FolderOpenIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Mostra Results Path qui dentro se esiste, come sotto-sezione */}
            {resultsPath && (
              <Box mt={2} pt={2} borderTop={`1px dashed ${theme.palette.divider}`} display="flex" alignItems="center" justifyContent="space-between">
                 <Box overflow="hidden" mr={2}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Last Results
                    </Typography>
                    <Typography variant="body2" noWrap sx={{ fontFamily: 'monospace', color: theme.palette.text.secondary }}>
                      {resultsPath}
                    </Typography>
                 </Box>
                 <IconButton size="small" onClick={handleOpenResultsFolder}>
                    <FolderOpenIcon fontSize="small" />
                 </IconButton>
              </Box>
            )}
          </Paper>
        ) : (
          // Placeholder se nessun progetto è selezionato
          <Paper 
            variant="outlined" 
            sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed', bgcolor: theme.palette.action.hover }}
          >
            <Typography color="text.secondary">
              No project selected. Please create or open a project from the File menu.
            </Typography>
          </Paper>
        )}

        {/* 3. ERROR BANNER */}
        {error && (
          <Paper sx={{ p: 2, bgcolor: theme.palette.error.light, color: theme.palette.error.contrastText }}>
            <Typography variant="subtitle2" fontWeight="bold">Error Occurred</Typography>
            <Typography variant="body2">{error || GlobalErrors.Unknown}</Typography>
          </Paper>
        )}

        {/* 4. GUIDE (In fondo o collassata) */}
        <SimulationGuide />
        
      </Stack>
    </Container>
  );
};

export default CoSimulation;