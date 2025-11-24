import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import ErrorSnackbar from './components/ErrorSnackbar';
import Main from './components/Main';
import CoSimulation from './components/Cosimulation/Cosimulation';
import LivePlottingContainer from './components/LivePlotting/LivePlottingContainer';

import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { lightTheme, darkTheme } from './utils/constants/style/themes';
import { styleConstants } from './utils/constants';
import { ThemeProviderContext, useTheme } from './contexts/ThemeContext';
import { ROUTES } from './utils/constants/appShared';

import type { NotificationType } from './types/global';

const AppContent: React.FC = () => {
  const { darkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // const sidebarWidth = sidebarOpen ? styleConstants.DRAWER_WIDTH : styleConstants.COLLAPSED_WIDTH;
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const isSidebarHidden = location.pathname === ROUTES.LivePlotting;

  // --- Window Resize ---
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < styleConstants.SIDEBAR.INNER_WIDTH_SIZE) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize(); // inizializza correttamente
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Create Project ---
  useEffect(() => {
    const handleCreateProject = (...args: unknown[]) => {
      const projectPath = args[0] as string; // cast sicuro
      console.log("[Renderer] Sending create-project for path:", projectPath);
      window.electronAPI.send("create-project", projectPath);
    };
  
    window.electronAPI.on("create-new-project", handleCreateProject);
  
    return () => {
      window.electronAPI.off("create-new-project", handleCreateProject);
    };
  }, []);

  // --- Project selection ---
  useEffect(() => {
    const handleProjectSelected = () => {
    };

    window.electronAPI?.on('project-selected', handleProjectSelected);

    return () => {
      window.electronAPI?.off('project-selected', handleProjectSelected);
    };
  }, []);

  // --- Start simulation from menu ---
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
        const typeError: NotificationType = 'error';
        window.electronAPI?.sendNotification('Failed to start simulation due to technical error.', typeError);
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
        <Box component="main" sx={styleConstants.MAIN_CONTENT}>
          <Routes>
            <Route path={ROUTES.Main} element={<Main />} />
            <Route path={ROUTES.CoSimulation} element={<CoSimulation />} />
            <Route path={ROUTES.LivePlotting} element={<LivePlottingContainer />} />
          </Routes>
        </Box>
      </Box>
      <ErrorSnackbar />
    </ThemeProvider >
  );
};


const App: React.FC = () => {
  return (
    <ThemeProviderContext>
      <AppContent />
    </ThemeProviderContext>
  );
};

export default App;