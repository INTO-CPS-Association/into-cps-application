import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { lightTheme, darkTheme } from './themes';
import Sidebar from './components/Sidebar';
import Bottom from './components/Bottom';
import ErrorSnackbar from './components/ErrorSnackbar';
import Main from './components/Main';
import CoSimulation from './components/Cosimulation/CoSimulation';
import { styleConstants } from './utils/constants';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = sidebarOpen ? styleConstants.DRAWER_WIDTH : styleConstants.COLLAPSED_WIDTH;

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
    } else {
      console.warn('window.electronAPI not found');
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeToggleDarkModeListener();
      }
    };
  }, []);

  useEffect(() => {
    const handleError = (errorMessage: string) => {
      console.error('[App] Error received:', errorMessage);
    };
  
    if (window.electronAPI) {
      window.electronAPI.addErrorListener(handleError);
    } else {
      console.warn('[App] window.electronAPI not found!');
    }
  
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeErrorListener();
      }
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
          <Bottom sidebarWidth={sidebarWidth} sidebarOpen={sidebarOpen} />
        </Box>
        <ErrorSnackbar />
      </Router>
    </ThemeProvider>
  );
};

export default App;