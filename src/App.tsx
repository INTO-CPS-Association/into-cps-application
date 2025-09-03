import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { lightTheme, darkTheme } from './themes';
import Sidebar from './components/Sidebar';
import ErrorSnackbar from './components/ErrorSnackbar';
import Main from './components/Main';
import CoSimulation from './components/Cosimulation/Cosimulation';
import { styleConstants } from './utils/constants';
import LivePlotting from './components/LivePlotting/LivePlotting';
import { useLivePlottingData } from './components/LivePlotting/useLivePlotting';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // const sidebarWidth = sidebarOpen ? styleConstants.DRAWER_WIDTH : styleConstants.COLLAPSED_WIDTH;
  const location = useLocation();
  const isSidebarHidden = location.pathname === '/live-plotting';
  const { data, autoZoomEnd } = useLivePlottingData();

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Fetch initial dark mode state from main process
  useEffect(() => {
    const initializeDarkMode = async () => {
      try {
        const initialDarkMode = await window.electronAPI?.getDarkMode();
        setDarkMode(initialDarkMode ?? false);
      } catch (error) {
        console.error('Failed to get initial dark mode:', error);
        setDarkMode(false); // Fallback to light mode
      }
    };

    initializeDarkMode();
  }, []);

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
      setDarkMode((prev) => {
        const newValue = !prev;
        window.electronAPI?.updateDarkMode(newValue);
        return newValue;
      });
    };

    // Listen for dark mode updates from main process
    const handleDarkModeUpdate = (...args: unknown[]) => {
      const isDark = args[0] as boolean;
      setDarkMode(isDark);
    };

    window.electronAPI?.addToggleDarkModeListener(handleToggleDarkMode);
    window.electronAPI?.on('dark-mode-update', handleDarkModeUpdate);

    return () => {
      window.electronAPI?.removeToggleDarkModeListener();
      window.electronAPI?.off('dark-mode-update', handleDarkModeUpdate);
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
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {!isSidebarHidden && <Sidebar open={sidebarOpen} toggleSidebar={toggleSidebar} />}
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
              <Route path="/live-plotting" element={<LivePlotting data={data} darkMode={darkMode} autoZoomEnd={autoZoomEnd} />} />
            </Routes>
          </Box>
        </Box>
        <ErrorSnackbar />
    </ThemeProvider>
  );
};

export default App;