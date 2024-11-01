import React, { useState } from 'react';
import { BottomNavigation, BottomNavigationAction, Box, Typography } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import StopCircleIcon from '@mui/icons-material/StopCircle';

const Bottom: React.FC = () => {
  const [coeRunning, setCoeRunning] = useState(false);

  const toggleCoeState = () => setCoeRunning((prev) => !prev);

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
          label={<Typography>{coeRunning ? 'Stop COE' : 'Start COE'}</Typography>}
          icon={coeRunning ? <StopCircleIcon color="error" /> : <PlayCircleOutlineIcon color="primary" />}
          onClick={toggleCoeState}
        />
      </BottomNavigation>
    </Box>
  );
};

export default Bottom;