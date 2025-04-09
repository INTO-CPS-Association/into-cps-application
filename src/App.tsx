import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { lightTheme, darkTheme } from './themes';
import Sidebar from './components/Sidebar';
import ErrorSnackbar from './components/ErrorSnackbar';
import Main from './components/Main';
import CoSimulation from './components/Cosimulation/Cosimulation';

import { styleConstants } from './utils/constants';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // const sidebarWidth = sidebarOpen ? styleConstants.DRAWER_WIDTH : styleConstants.COLLAPSED_WIDTH;

  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < styleConstants.INNER_WIDTH_SIZE) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const handleToggleDarkMode = () => {
      toggleDarkMode();
    };

    if (window.electronAPI) {
      window.electronAPI.addToggleDarkModeListener(handleToggleDarkMode);
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeToggleDarkModeListener();
      }
    };
  }, []);

  useEffect(() => {
    const handleProjectSelected = () => {
    };

    window.electronAPI?.on('project-selected', handleProjectSelected);

    return () => {
      window.electronAPI?.off('project-selected', handleProjectSelected);
    };
  }, []);

  useEffect(() => {
    const handleError = (errorMessage: string) => {
      console.error('[App] Error received:', errorMessage);
    };

    if (window.electronAPI) {
      window.electronAPI.addErrorListener(handleError);
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeErrorListener();
      }
    };
  }, []);

  useEffect(() => {
    const handleMenuStartSimulation = async () => {

      try {
        const response = await window?.cosimulationAPI?.maestro({
          type: 'start-simulation',
        });
        if (!response?.success) {
          const errorMessage = response?.error || 'Unknown error';
          console.error('Simulation failed to start:', errorMessage);

          window.electronAPI?.sendNotification(errorMessage, 'error');
        }
      } catch (err) {
        console.error('Failed to start simulation due to technical error:', err);

        window.electronAPI?.sendNotification('Failed to start simulation due to technical error.', 'error');
      }
    };

    window.electronAPI.on('menu-start-simulation', handleMenuStartSimulation);

    return () => {
      window.electronAPI.off('menu-start-simulation', handleMenuStartSimulation);
    };
  }, []);

  return (
    <ThemeProvider theme={darkMode ? lightTheme : darkTheme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar open={sidebarOpen} toggleSidebar={toggleSidebar} />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              transition: `margin-left ${styleConstants.TRANSITION_DURATION} ease`,
              marginLeft: `-10px`,
            }}
          >
            <Routes>
              <Route path="/" element={<Main />} />
              <Route path="/cosimulation" element={<CoSimulation />} />
            </Routes>
          </Box>
        </Box>
        <ErrorSnackbar />
      </Router>
    </ThemeProvider>
  );
};

export default App;