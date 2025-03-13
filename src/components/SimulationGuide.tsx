import React from 'react';
import { Typography, Box } from '@mui/material';

const SimulationGuide: React.FC = () => (
  <Box sx={{ mt: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
    <Typography variant="h6" gutterBottom>
      How to run a Co-Simulation
    </Typography>
    <Typography variant="body2">
      1. Select a Co-Simulation project from <strong>File &gt; Choose Project</strong>.
    </Typography>
    <Typography variant="body2">
      2. Start Maestro by clicking <strong>&quot;Start CoE&quot;</strong> in the bottom bar.
    </Typography>
    <Typography variant="body2">
      3. Run the simulation from the menu under <strong>CoSimulation &gt; Start Simulation</strong>.
    </Typography>
    <Typography variant="body2">
      4. View status updates and results in the CoSimulation page.
    </Typography>
  </Box>
);

export default SimulationGuide;