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
    console.error('[Error]:', message);
  
    if (process?.type === 'renderer') {
      if (window?.electronAPI?.dispatchActionToMain) {
        window.electronAPI.dispatchActionToMain({ type: 'error', payload: { message } });
      } else {
        console.warn('[Error] electronAPI not found in renderer!');
      }
    } else if (process?.type === 'browser') {
      const { ipcMain } = require('electron');
      ipcMain.emit('trigger-error', null, message);
    } else {
      console.warn('[Error] Unknown process type!');
    }
  }

/**
 * Sends a notification from Electron's main process to the renderer.
 *
 * @param message - The message to display in the notification.
 * @param type - The type of notification ('success', 'error', 'warning', 'info').
 */
export function sendNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
  if (process?.type === 'renderer') {
    if (window?.electronAPI?.dispatchActionToMain) {
      window.electronAPI.dispatchActionToMain({ type: 'notification', payload: { message, type } });
    }
  } else if (process?.type === 'browser') {
    const { ipcMain } = require('electron');
    ipcMain.emit('trigger-notification', null, message, type);
  } else {
    console.warn('[Notification] Unknown process type!');
  }
}
