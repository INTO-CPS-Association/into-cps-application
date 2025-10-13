const noop = (): void => undefined
const consoleMethods = ['log', 'info', 'warn', 'error', 'debug'] as const

(global as unknown as { __originalConsole?: Console }).__originalConsole = global.console

for (const m of consoleMethods) {
  try {
    console[m] = noop
  } catch (err) {
    // eslint-disable-next-line no-console
    console.debug?.('jest.silentConsole: failed to override console method', (err as Error).message)
  }
}
