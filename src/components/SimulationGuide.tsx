// import React from 'react';
// import { Typography, Box } from '@mui/material';
// import { PAGETITLES, LABELS } from '../utils/constants';

// const SimulationGuide: React.FC = () => (
//   <Box sx={{ mt: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
//     <Typography variant="h6" gutterBottom>
//       {PAGETITLES.SimulationGuide}
//     </Typography>
//     <Typography variant="body2">
//       {LABELS.SimulationGuide.Steps[0]}
//     </Typography>
//     <Typography variant="body2">
//       {LABELS.SimulationGuide.Steps[1]}
//     </Typography>
//     <Typography variant="body2">
//       {LABELS.SimulationGuide.Steps[2]}
//     </Typography>
//   </Box>
// );

// export default SimulationGuide;

import React from 'react';
import { 
  Typography, 
  Box, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  useTheme 
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { PAGETITLES, LABELS } from '../utils/constants';

const SimulationGuide: React.FC = () => {
  const theme = useTheme();

  return (
    <Accordion 
      defaultExpanded 
      elevation={0} 
      sx={{ 
        border: `1px solid ${theme.palette.divider}`, 
        borderRadius: '8px !important',
        '&:before': { display: 'none' },
        mt: 2
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center" gap={1}>
          <InfoOutlinedIcon color="primary" />
          <Typography variant="subtitle1" fontWeight="bold">
            {PAGETITLES.SimulationGuide}
          </Typography>
        </Box>
      </AccordionSummary>
      
      <AccordionDetails sx={{ pt: 0 }}>
        <List dense>
          {LABELS.SimulationGuide.Steps.map((step, index) => (
            <ListItem key={index}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Box 
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%', 
                    bgcolor: theme.palette.primary.light, 
                    color: theme.palette.primary.contrastText,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}
                >
                  {index + 1}
                </Box>
              </ListItemIcon>
              <ListItemText primary={step} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItem>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
};

export default SimulationGuide;