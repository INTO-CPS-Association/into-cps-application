const fs = require('fs');
const https = require('https');
const path = require('path');

const MAESTRO_VERSION = '3.0.0';
const MAESTRO_JAR_URL = `https://repo1.maven.org/maven2/org/into-cps/maestro/maestro-webapi/${MAESTRO_VERSION}/maestro-webapi-${MAESTRO_VERSION}-bundle.jar`;
const DESTINATION_DIR = path.join(__dirname, '../src/resources/maestro');
const DESTINATION_FILE = path.join(DESTINATION_DIR, `maestro-webapi-${MAESTRO_VERSION}-bundle.jar`);

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