/**
 * Theme definitions
 * Centralized MUI themes for light and dark mode
 */

import { createTheme, Theme } from '@mui/material/styles';
import { LIGHTCOLORS, DARKCOLORS } from '..';

// -------------------- Light Theme --------------------
export const lightTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: LIGHTCOLORS.PRIMARY,
    },
    secondary: {
      main: LIGHTCOLORS.SECONDARY,
    },
    background: {
      default: LIGHTCOLORS.BACKGROUND.DEFAULT,
      paper: LIGHTCOLORS.BACKGROUND.PAPER,
    },
    text: { primary: LIGHTCOLORS.TEXT },
  },
});

// -------------------- Dark Theme --------------------
export const darkTheme: Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: DARKCOLORS.PRIMARY,
    },
    secondary: {
      main: DARKCOLORS.SECONDARY,
    },
    background: {
      default: DARKCOLORS.BACKGROUND.DEFAULT,
      paper: DARKCOLORS.BACKGROUND.PAPER,
    },
    text: { primary: DARKCOLORS.TEXT },

  },
});
