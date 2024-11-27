import React, { useState } from 'react';
import { BottomNavigation, BottomNavigationAction, Box, Typography } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import StopCircleIcon from '@mui/icons-material/StopCircle';

const Bottom: React.FC = () => {
  const [coeRunning, setCoeRunning] = useState(false);

  const toggleCoeState = async () => {
    try {
      if (coeRunning) {
        await window?.electronAPI?.stopCoe();
      } else {
        await window?.electronAPI?.startCoe();
      }
      setCoeRunning(!coeRunning);
    } catch (error) {
      console.error('Error toggling COE:', error);
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
          id="coe-btn-launch-bottom"
          label={<Typography>{coeRunning ? 'Stop COE' : 'Start COE'}</Typography>}
          icon={
            coeRunning ? (
              <StopCircleIcon id="coeIconColor" color="error" />
            ) : (
              <PlayCircleOutlineIcon id="coeIconColor" color="primary" />
            )
          }
          onClick={toggleCoeState}
        />
      </BottomNavigation>
    </Box>
  );
};

export default Bottom;