/**
 * Error messages related to Maestro
 */
export const MaestroErrors = {
    JarNotFound: "Maestro JAR not found. Please ensure it is installed correctly.",
} as const;

/**
* Generic error messages that are not specific to CoSimulation or Maestro
*/
export const GlobalErrors = {
    Unknown: "An unknown error occurred.",
} as const;
