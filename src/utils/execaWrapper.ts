let execaInstance: any;

export function getExeca() {
  if (!execaInstance) {
    execaInstance = require('execa');
  }
  return execaInstance.execa;
}
