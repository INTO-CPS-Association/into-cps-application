import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import workerPlugin from '@chialab/esbuild-plugin-worker';

const isDev = process.argv.includes('--dev');
console.log(`Starting esbuild in ${isDev ? 'development' : 'production'} mode...`);

const sharedConfig = {
  bundle: true,
  target: 'es2020',
  define: {
    'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
  },
  sourcemap: isDev,
  minify: !isDev,
};

function buildMain() {
  return esbuild.build({
    ...sharedConfig,
    entryPoints: ['./src/main.ts'],
    outfile: 'dist/main.js',
    platform: 'node',
    external: ['electron'],
  });
}

function buildRenderer() {
    return esbuild.build({
      ...sharedConfig,
      entryPoints: ['./src/index.tsx'],
      outfile: 'dist/bundle.js',
      platform: 'browser',
      format: 'esm',
      plugins: [workerPlugin()],
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
        '.ts': 'tsx',
        '.tsx': 'tsx',
        '.ttf': 'file',
        '.css': 'file',
      },
      jsx: "automatic",
      jsxImportSource: "react",
    });
  }
  

function buildPreload() {
  return esbuild.build({
    ...sharedConfig,
    entryPoints: ['./preload.js'],
    outfile: 'dist/preload.js',
    platform: 'node',
    external: ['electron'],
  });
}

function copyStaticFiles() {
  const publicPath = path.resolve('public');
  const distPath = path.resolve('dist');
  const resourcesPath = path.resolve('src/resources');

  if (!fs.existsSync(distPath)) fs.mkdirSync(distPath, { recursive: true });

   // Copy index.html
   fs.copyFileSync(path.join(publicPath, 'index.html'), path.join(distPath, 'index.html'));

   // Copy resources folder
   copyRecursiveSync(resourcesPath, path.join(distPath, 'resources'));
 
   // Copy preload.js
   fs.copyFileSync('dist/preload.js', path.join(distPath, 'preload.js'));
}

// Recursive function to copy files and directories
function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  const isDirectory = stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

Promise.all([buildMain(), buildRenderer(), buildPreload()])
  .then(() => {
    copyStaticFiles();
    console.log('Build completed.');
  })
  .catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
  });