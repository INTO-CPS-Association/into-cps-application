import React from 'react';
import { Typography, Box } from '@mui/material';
import SimulationGuide from './SimulationGuide';
import { PAGETITLES, LABELS } from '../utils/constants';
import { APP_VERSION } from '../utils/constants/appShared';

const Main: React.FC = () => (
  <Box>
    <Typography variant="h4" component="h1" gutterBottom>
      {PAGETITLES.Main}
    </Typography>
    <Typography variant="body1">
      {LABELS.Main.Message}
      <Typography variant="body1" component="span" id="appVersion">
        {' '}{APP_VERSION}
      </Typography>
    </Typography>
    <SimulationGuide />
  </Box>
);

export default Main;
