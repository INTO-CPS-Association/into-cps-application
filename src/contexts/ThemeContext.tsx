import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProviderContext = ({ children }: ThemeProviderProps) => {
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const handleDarkModeUpdate = (...args: unknown[]) => {
      const isDark = args[0] as boolean | undefined;
      setDarkMode(isDark ?? ((prev) => !prev));
    };
  
    window.electronAPI?.on('dark-mode-update', handleDarkModeUpdate);
    window.electronAPI?.addToggleDarkModeListener(() => handleDarkModeUpdate());
  
    return () => {
      window.electronAPI?.off('dark-mode-update', handleDarkModeUpdate);
      window.electronAPI?.removeToggleDarkModeListener();
    };
  }, []);
  
  const toggleDarkMode = () => {
    window.electronAPI?.toggleDarkMode();
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
