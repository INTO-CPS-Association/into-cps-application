import { createTheme, Theme } from '@mui/material/styles';
import { lightColors, darkColors } from './utils/constants';

export const lightTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: lightColors.primary,
    },
    secondary: {
      main: lightColors.secondary,
    },
    background: {
      default: lightColors.background.default,
      paper: lightColors.background.paper,
    },
  },
  cssVariables: { cssVarPrefix: '' },
});

export const darkTheme: Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: darkColors.primary,
    },
    secondary: {
      main: darkColors.secondary,
    },
    background: {
      default: darkColors.background.default,
      paper: darkColors.background.paper,
    },
  },
  cssVariables: { cssVarPrefix: '' },
});
