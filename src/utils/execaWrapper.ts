let _cachedExeca: typeof import('execa').execa | undefined;

export function getExeca() {
  if (!_cachedExeca) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- intentional lazy-require to avoid import-time ESM side-effects in tests
    const { execa } = require('execa');
    _cachedExeca = execa;
  }
  return _cachedExeca;
}