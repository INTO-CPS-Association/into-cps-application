/**
 * Handles errors in Electron based on process type.
 * 
 * - **Renderer**: Sends error to main via `electronAPI.dispatchActionToMain`.
 * - **Main**: Emits error with `ipcMain.emit` for renderer handling.
 * - **Fallback**: Logs a warning for unknown process types.
 * 
 * @param error - The error object to handle (can be `Error` or generic).
 */

export function handleError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[handleError Triggered]:', message);
  
    if (process?.type === 'renderer') {
      if (window?.electronAPI?.dispatchActionToMain) {
        window.electronAPI.dispatchActionToMain({ type: 'error', payload: { message } });
      } else {
        console.warn('[handleError] electronAPI not found in renderer!');
      }
    } else if (process?.type === 'browser') {
      const { ipcMain } = require('electron');
      ipcMain.emit('trigger-error', null, message);
    } else {
      console.warn('[handleError] Unknown process type!');
    }
  }
  