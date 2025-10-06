import React from 'react';
import { Typography, Box } from '@mui/material';
import { PAGETITLES, LABELS } from '../utils/constants';

const SimulationGuide: React.FC = () => (
  <Box sx={{ mt: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
    <Typography variant="h6" gutterBottom>
      {PAGETITLES.SimulationGuide}
    </Typography>
    <Typography variant="body2">
      {LABELS.SimulationGuide.Steps[0]}
    </Typography>
    <Typography variant="body2">
      {LABELS.SimulationGuide.Steps[1]}
    </Typography>
    <Typography variant="body2">
      {LABELS.SimulationGuide.Steps[2]}
    </Typography>
  </Box>
);

export default SimulationGuide;