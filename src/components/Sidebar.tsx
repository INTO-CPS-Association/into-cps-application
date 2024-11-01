import React from 'react';
import { Drawer, List, Divider, Toolbar } from '@mui/material';

const Sidebar: React.FC = () => (
  <Drawer
    variant="permanent"
    sx={{
      width: 240,
      flexShrink: 0,
      [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box' },
    }}
  >
    <Toolbar />
    <Divider />
    <List>
    </List>
  </Drawer>
);

export default Sidebar;