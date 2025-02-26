import net from 'net';
import { exec } from 'node:child_process';
import kill from 'tree-kill';
import { handleError, sendNotification } from '../errorHandler';

/**
 * Checks if a given port is in use.
 * @param port - The port to check.
 * @returns A promise that resolves to true if the port is in use, false otherwise.
 */
export async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close(() => resolve(false));
    });
    server.listen(port);
  });
}

/**
 * Kills the process running on a given port.
 * @param port - The port to free up by killing the associated process.
 * @returns A promise that resolves when the process is killed or if no process is found.
 */
export async function killProcessOnPort(port: number): Promise<void> {
  return new Promise((resolve) => {
    const command = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port}`;

    exec(command, (error, stdout) => {
      if (error || !stdout) {
        console.warn(`No process found on port ${port}`);
        resolve();
        return;
      }

      const lines = stdout.trim().split('\n');
      const pids: Set<number> = new Set();

      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        const pid = process.platform === 'win32'
          ? parseInt(parts[parts.length - 1], 10)
          : parseInt(parts[1], 10);

        if (!isNaN(pid)) {
          pids.add(pid);
        }
      });

      if (pids.size === 0) {
        console.warn(`No valid PID found for port ${port}`);
        resolve();
        return;
      }

      let remaining = pids.size;
      pids.forEach((pid) => {
        console.log(`Killing process on port ${port} with PID: ${pid}`);
        kill(pid, 'SIGTERM', (err) => {
          if (err) {
            handleError(`Failed to kill process with PID ${pid}:`);
          } else {
            sendNotification(`Successfully killed process with PID ${pid}`, 'success');
          }
          remaining -= 1;
          if (remaining === 0) {
            resolve();
          }
        });
      });
    });
  });
}