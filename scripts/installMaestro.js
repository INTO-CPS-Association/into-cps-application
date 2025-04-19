const fs = require('fs');
const path = require('path');
const https = require('https');
const maestroConfig = require('../src/resources/maestro/maestro-version.json');

const MAESTRO_VERSION = maestroConfig.version;
const MAESTRO_JAR_URL = `https://repo1.maven.org/maven2/org/into-cps/maestro/maestro/${MAESTRO_VERSION}/maestro-${MAESTRO_VERSION}-jar-with-dependencies.jar`;
const DESTINATION_DIR = path.join(__dirname, '../src/resources/maestro');
const DESTINATION_FILE = path.join(DESTINATION_DIR, `maestro-${MAESTRO_VERSION}-jar-with-dependencies.jar`);

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file: ${response.statusCode} ${response.statusMessage}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close(() => resolve());
      });
    }).on('error', (err) => {
      fs.unlink(destination, () => reject(err));
    });
  });
}

if (!fs.existsSync(DESTINATION_DIR)) {
  fs.mkdirSync(DESTINATION_DIR, { recursive: true });
}

console.log('Downloading Maestro JAR from Maven Central...');
downloadFile(MAESTRO_JAR_URL, DESTINATION_FILE)
  .then(() => {
    console.log(`Maestro JAR downloaded successfully to ${DESTINATION_FILE}`);
  })
  .catch((error) => {
    console.error('Failed to download Maestro JAR:', error);
    process.exit(1);
  });