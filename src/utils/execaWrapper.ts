let _cachedExeca: typeof import('execa').execa | undefined;

export function getExeca() {
  if (!_cachedExeca) {
    const { execa } = require('execa');
    _cachedExeca = execa;
  }
  return _cachedExeca;
}