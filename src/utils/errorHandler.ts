import { NotificationType } from '../types/global';
import { logError, logWarn } from '../utils/logger';
import { ipcMain } from 'electron';

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

  if (process?.type === 'renderer') {
    console.error('[Error Renderer]:', message);
    if (window?.electronAPI?.dispatchActionToMain) {
      window.electronAPI.dispatchActionToMain({ type: 'error', payload: { message } });
    } else {
      console.warn('[Error Renderer] electronAPI not found.');
    }
  } else if (process?.type === 'browser') {
    logError('[Error Main Process]: ' + message);
    ipcMain.emit('show-notification', null, message, 'error');
  } else {
    logWarn('[Error] Unknown process type.');
  }
}

/**
 * Sends a notification from Electron's main process to the renderer.
 *
 * @param message - The message to display in the notification.
 * @param type - The type of notification ('success', 'error', 'warning', 'info'), taken from NotificationType.
 */
export function sendNotification(message: string, type: NotificationType) {
  if (process?.type === 'renderer') {
    if (window?.electronAPI?.dispatchActionToMain) {
      window.electronAPI.dispatchActionToMain({ type: 'notification', payload: { message, type } });
    }
  } else if (process?.type === 'browser') {
    ipcMain.emit('show-notification', null, message, type);
  } else {
    logWarn('[Notification] Unknown process type.');
  }
}
