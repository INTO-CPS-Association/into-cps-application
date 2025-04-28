import { execSync } from 'node:child_process';

/**
 * Generates a timestamp string in a user-friendly format: YYYY-MM-DD_HH-MM-SS
 */
export function getReadableTimestamp(): string {
  const now = new Date();
  return now
    .toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .replace(/\..+/, '');
}

/**
 * Returns the Java executable path if found in the system PATH, otherwise returns 'java'.
 */

export function getJavaCommand(): string {
  
  try {
    const platform = (process as any).platform;
    const cmd = platform === 'win32' ? 'where java' : 'which java';
    const output = execSync(cmd).toString().trim();

    // 'where' can return multiple lines, take the first
    const javaPath = output.split(/\r?\n/)[0];

    if (javaPath) return javaPath;
  } catch (err) {
    console.warn('[Maestro] Java not found in PATH:', err);
  }

  return 'java'; // fallback
}
