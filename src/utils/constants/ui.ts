/**
 * UI constants
 * Centralized constants for window sizes, labels, texts, and icons
 */

import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';

// -------------------- Window Dimensions --------------------
export const GRAPH_WINDOW = {
    WIDTH: 800,
    HEIGHT: 600,
} as const;

export const MAIN_WINDOW = {
    WIDTH: 800,
    HEIGHT: 600,
} as const;

// -------------------- Page Titles --------------------
export const PAGETITLES = {
    CoSimulation: "CoSimulation",
    Main: "INTO-CPS > Welcome",
    SimulationGuide: "How to run a Co-Simulation",
} as const;

// -------------------- Labels --------------------
export const LABELS = {
    CoSimulation: {
        Status: "Simulation Status:",
        Results: "Results saved at:",
    },
    Main: {
        Message: "Welcome to the INTO-CPS Application",
    },
    Sidebar: {
        Main: "Home",
        CoSimulation: "Cosimulation",
    },
    SimulationGuide: {
        Steps: [
            "Select a Co-Simulation project from File > Choose Project.",
            "Run the simulation from the menu under CoSimulation > Start Simulation.",
            "View status updates and results in the CoSimulation page."
        ] as const,
    },
    Menu: {
        File: "File",
        ChooseProject: {
            Label: "Choose Project",
            Dialogue: "Select Project Folder"
        },
        Quit: "Quit",
        View: "View",
        ToggleDarkMode: "Toggle Dark Mode",
        ToggleDevTools: "Toggle Developer Tools",
        Cosimulation: "Cosimulation",
        StartSimulation: "Start Simulation",
    }
} as const;

// -------------------- Icons --------------------
export const ICONS = {
    Main: HomeIcon,
    CoSimulation: SettingsIcon,
} as const;

// -------------------- Shortcuts --------------------
export const SHORTCUTS = {
    Menu: {
        DevTools: "CmdOrCtrl+Shift+I",
    }
} as const;

// -------------------- Notification Types --------------------
export const NOTIFICATION_TYPES = {
    ERROR: 'error',
    SUCCESS: 'success',
    WARNING: 'warning',
    INFO: 'info',
  } as const;
  