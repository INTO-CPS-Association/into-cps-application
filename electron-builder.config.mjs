import fs from "fs";
import path from "path";

/** @type {import("electron-builder").Configuration} */
export default {
  directories: {
    output: "release"
  },
  files: [
    "dist/**/*",
    "package.json",
    "launcher.sh", // Include the launcher script from project root
    "!node_modules/playwright",
    "!node_modules/playwright-core",
    "!node_modules/**/playwright*/**"
  ],
  linux: {
    target: ["AppImage"],
    icon: "src/resources/into-cps/appicon/into-cps-logo.png"
  },
  afterPack: async (context) => {
    // Set setuid bit on chrome-sandbox if it exists
    const sandboxPath = path.join(context.appOutDir, "chrome-sandbox");
    if (fs.existsSync(sandboxPath)) {
      try {
        fs.chmodSync(sandboxPath, 0o4755);
        console.log("Set setuid bit on chrome-sandbox");
      } catch (err) {
        console.warn("Failed to set setuid on chrome-sandbox:", err.message);
      }
    }

    // Source launcher from project root
    const srcLauncher = path.resolve("launcher.sh");

    // Copy launcher into linux-unpacked and make it executable
    const destLauncherUnpacked = path.join(context.appOutDir, "INTO-CPS Application Launcher");
    if (fs.existsSync(srcLauncher)) {
      fs.copyFileSync(srcLauncher, destLauncherUnpacked);
      fs.chmodSync(destLauncherUnpacked, 0o755);
      console.log("Launcher copied inside linux-unpacked and made executable.");
    } else {
      console.warn("Launcher not found in root directory.");
    }

    // Copy launcher next to the AppImage in release/ and make it executable
    const releaseDir = path.resolve("release");
    const destLauncherAppImage = path.join(releaseDir, "INTO-CPS Application Launcher");
    if (fs.existsSync(srcLauncher)) {
      fs.copyFileSync(srcLauncher, destLauncherAppImage);
      fs.chmodSync(destLauncherAppImage, 0o755);
      console.log("Launcher copied next to AppImage and made executable.");
    }
  }
};