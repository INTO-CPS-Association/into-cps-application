import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { lightTheme, darkTheme } from './themes';
import Sidebar from './components/Sidebar';
import Bottom from './components/Bottom';
import Main from './components/Main';
import Cosimulation from './components/Cosimulation/Cosimulation';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

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

  return (
    <ThemeProvider theme={darkMode ? lightTheme : darkTheme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <Box component="main" sx={{ flexGrow: 1, p: 3, position: 'relative' }}>
            <Routes>
              <Route path="/" element={<Main />} />
              <Route path="/cosimulation" element={<Cosimulation />} />
            </Routes>
          </Box>
          <Bottom />
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;