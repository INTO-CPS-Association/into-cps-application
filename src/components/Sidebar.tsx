import React from 'react';
import { Drawer, List, ListItem, ListItemText, ListItemButton, Toolbar } from '@mui/material';
import { NavLink } from 'react-router-dom';

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
    <List>
      <ListItem disablePadding>
        <ListItemButton component={NavLink} to="/">
          <ListItemText primary="Home" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton component={NavLink} to="/cosimulation">
          <ListItemText primary="Cosimulation" />
        </ListItemButton>
      </ListItem>
    </List>
  </Drawer>
);

export default Sidebar;