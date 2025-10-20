import React from 'react';
import { NavLink } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemText, ListItemButton, Toolbar, IconButton } from '@mui/material';
import { ICONS } from '../utils/constants';
import { styleConstants, LABELS } from '../utils/constants';
import { ROUTES } from '../utils/constants/appShared';

import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

interface SidebarProps {
  open: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, toggleSidebar }) => {
  const HomeIcon = ICONS.Main;
  const CoSimulationIcon = ICONS.CoSimulation;

    return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? styleConstants.SIDEBAR.DRAWER_WIDTH : styleConstants.SIDEBAR.COLLAPSED_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: open ? styleConstants.SIDEBAR.DRAWER_WIDTH : styleConstants.SIDEBAR.COLLAPSED_WIDTH,
          boxSizing: 'border-box',
          transition: `width ${styleConstants.SIDEBAR.TRANSITION_DURATION} ease`,
        },
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: open ? 'flex-end' : 'center',
          alignItems: 'center',
          height: `${styleConstants.SIDEBAR.TOOLBAR_HEIGHT}px`,
        }}
      >
        <IconButton onClick={toggleSidebar}>
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Toolbar>
      <List>
        <ListItem disablePadding>
          <ListItemButton component={NavLink} to={ROUTES.Main}>
            <HomeIcon />
            {open && <ListItemText primary={LABELS.Sidebar.Main} sx={{ marginLeft: 1 }} />}
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={NavLink} to={ROUTES.CoSimulation}>
            <CoSimulationIcon />
            {open && <ListItemText primary={LABELS.Sidebar.CoSimulation} sx={{ marginLeft: 1 }} />}
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;