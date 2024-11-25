import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { lightTheme, darkTheme } from './themes';
import Sidebar from './components/Sidebar';
import Main from './components/Main';
import Bottom from './components/Bottom';

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
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        
        <Box component="main" sx={{ flexGrow: 1, p: 3, position: 'relative' }}>
          <Main />
        </Box>
        
        <Bottom />
      </Box>
    </ThemeProvider>
  );
};

export default App;