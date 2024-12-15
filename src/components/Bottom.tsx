import React, { useState } from 'react';
import { BottomNavigation, BottomNavigationAction, Box, Typography } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import StopCircleIcon from '@mui/icons-material/StopCircle';

const Bottom: React.FC = () => {
  const [maestroRunning, setMaestroRunning] = useState(false);

  const toggleMaestroState = async () => {
    try {
      if (maestroRunning) {
        await window?.electronAPI?.stopMaestro();
      } else {
        await window?.electronAPI?.startMaestro();
      }
      setMaestroRunning(!maestroRunning);
    } catch (error) {
      console.error('Error toggling Maestro:', error);
    }
  };

  return (
    <Box
      sx={{
        width: 'calc(100% - 240px)',
        position: 'fixed',
        bottom: 0,
        left: '240px',
        bgcolor: 'background.paper',
        boxShadow: 3,
      }}
    >
      <BottomNavigation showLabels sx={{ justifyContent: 'flex-start' }}>
        <BottomNavigationAction
          id="maestro-btn-launch-bottom"
          label={<Typography>{maestroRunning ? 'Stop Maestro' : 'Start Maestro'}</Typography>}
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