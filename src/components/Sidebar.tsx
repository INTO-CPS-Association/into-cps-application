import React, { useState, useEffect } from 'react';
import { Drawer, List, ListItem, ListItemText, ListItemButton, Toolbar, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import { NavLink } from 'react-router-dom';
import { styleConstants } from "../utils/constants";

const Sidebar: React.FC<{ open: boolean; toggleSidebar: () => void }> = ({ open, toggleSidebar }) => {
  const [isResponsive, setIsResponsive] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < styleConstants.INNER_WIDTH_SIZE) {
        setIsResponsive(true);
        setManualOpen(false);
      } else {
        setIsResponsive(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
    
  const handleToggle = () => {
    setManualOpen(!manualOpen);
    toggleSidebar();
  };

  const isOpen = isResponsive ? manualOpen : open;

  return (
    <Drawer
      variant="permanent"
      open={isOpen}
      sx={{
        width: isOpen ? styleConstants.DRAWER_WIDTH : styleConstants.COLLAPSED_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: isOpen ? styleConstants.DRAWER_WIDTH : styleConstants.COLLAPSED_WIDTH,
          boxSizing: 'border-box',
          transition: `width ${styleConstants.TRANSITION_DURATION} ease`,
        },
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: isOpen ? 'flex-end' : 'center',
          alignItems: 'center',
          height: `${styleConstants.TOOLBAR_HEIGHT}px`,
        }}
      >
        <IconButton onClick={handleToggle}>
          {isOpen ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Toolbar>
      <List>
        <ListItem disablePadding>
          <ListItemButton component={NavLink} to="/">
            <HomeIcon />
            {isOpen && <ListItemText primary="Home" sx={{ marginLeft: 1 }} />}
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={NavLink} to="/cosimulation">
            <SettingsIcon />
            {isOpen && <ListItemText primary="Cosimulation" sx={{ marginLeft: 1 }} />}
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;