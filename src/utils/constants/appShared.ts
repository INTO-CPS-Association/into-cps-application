import packageJson from '../../../package.json';

export const IS_DEV = (process.env.NODE_ENV ?? "production") === "development";
export const APP_VERSION = packageJson.version;
  
export const ROUTES = {
  Main: "/",
  CoSimulation: "/cosimulation",
  LivePlotting: "/live-plotting",
} as const;