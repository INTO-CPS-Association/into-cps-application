import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

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
        loader: { '.js': 'jsx', '.jsx': 'jsx', '.ts': 'tsx', '.tsx': 'tsx' },
    });
}

// Recursive function to copy files and directories
function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

function copyStaticFiles() {
    const publicPath = path.resolve('public');
    const distPath = path.resolve('dist');
    const resourcesPath = path.resolve('src/resources');

    // Copy index.html
    const sourceHtmlPath = path.join(publicPath, 'index.html');
    const destHtmlPath = path.join(distPath, 'index.html');
    if (fs.existsSync(sourceHtmlPath)) {
        fs.copyFileSync(sourceHtmlPath, destHtmlPath);
        console.log('index.html copied to dist folder');
    } else {
        console.error(`Source index.html not found at ${sourceHtmlPath}`);
        process.exit(1);
    }

    // Copy the resources folder
    const destResourcesPath = path.join(distPath, 'resources');
    if (fs.existsSync(resourcesPath)) {
        copyRecursiveSync(resourcesPath, destResourcesPath);
        console.log('Resources folder copied to dist folder');
    } else {
        console.error(`Resources folder not found at ${resourcesPath}`);
    }
}

Promise.all([buildMain(), buildRenderer()])
    .then(() => {
        copyStaticFiles();
        console.log('Build completed.');
    })
    .catch((err) => {
        console.error('Build failed:', err);
        process.exit(1);
    });