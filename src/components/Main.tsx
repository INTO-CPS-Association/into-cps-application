import React from 'react';
import { Typography, Box } from '@mui/material';

const Main: React.FC = () => (
  <Box>
    <Typography variant="h4" component="h1" gutterBottom>
      INTO-CPS &gt; Welcome
    </Typography>
    <Typography variant="body1">
      Welcome to the INTO-CPS Application<Typography variant="body1" id="appVersion"> 5.0.0</Typography>
    </Typography>
  </Box>
);

export default Main;