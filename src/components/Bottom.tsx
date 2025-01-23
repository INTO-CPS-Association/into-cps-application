import React, { useState } from 'react';
import { BottomNavigation, BottomNavigationAction, Box, Typography, useTheme } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import { styleConstants } from '../utils/constants';

const Bottom: React.FC<{ sidebarWidth: number; sidebarOpen: boolean }> = ({ sidebarWidth, sidebarOpen }) => {
  const [maestroRunning, setMaestroRunning] = useState(false);
  const theme = useTheme();
  
  const toggleMaestroState = async () => {
    try {
      const type = maestroRunning ? 'stop' : 'start';
      const response = await window?.cosimulationAPI?.maestro(type);

      if (response?.success) {
        setMaestroRunning(!maestroRunning);
      } else {
        console.error('Error toggling Maestro:', response?.error || 'Unknown error');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error toggling Maestro:', message);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        position: 'fixed',
        bottom: 0,
        left: `${sidebarWidth}px`,
        bgcolor: 'background.paper',
        boxShadow: theme.shadows[3],
        transition: `left ${styleConstants.TRANSITION_DURATION} ease, width ${styleConstants.TRANSITION_DURATION} ease`,
      }}
    >
      <BottomNavigation showLabels sx={{ justifyContent: 'flex-start' }}>
        <BottomNavigationAction
          id="maestro-btn-launch-bottom"
          label={<Typography>{maestroRunning ? 'Stop CoE' : 'Start CoE'}</Typography>}
          icon={
            maestroRunning ? (
              <StopCircleIcon id="maestroIconColor" color="error" />
            ) : (
              <PlayCircleOutlineIcon id="maestroIconColor" color="primary" />
            )
          }
          onClick={toggleMaestroState}
        />
      </BottomNavigation>
    </Box>
  );
};

export default Bottom;
