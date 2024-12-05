import React, { useState } from 'react';
import { BottomNavigation, BottomNavigationAction, Box, Typography, useTheme } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import StopCircleIcon from '@mui/icons-material/StopCircle';

const Bottom: React.FC<{ sidebarWidth: number; sidebarOpen: boolean }> = ({ sidebarWidth, sidebarOpen }) => {
  const [coeRunning, setCoeRunning] = useState(false);
  const theme = useTheme();

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
        width: '100%',
        position: 'fixed',
        bottom: 0,
        left: `${sidebarWidth}px`,
        bgcolor: 'background.paper',
        boxShadow: theme.shadows[3],
        transition: 'left 0.3s ease, width 0.3s ease',
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