# Development environment documentation

## Required technologies and tools

- [Node Package Manager (NPM)](https://www.npmjs.com/package/npm): a package management system used to maintain packages used by the application. NPM 3 or higher is required.
- [Node.js](https://nodejs.org/) (v22.x is required).
- [Visual Studio Code](https://code.visualstudio.com/) is a good choice as an editor: it's cross-platform and is actually built on top of Electron. That said, everything can be used.
- [MSIX Packaging Tool](https://apps.microsoft.com/detail/9n5lw3jbcxkf?hl=it-it&gl=DK) is needed to convert the `.msi` installer to `.msix`.

To manage multiple versions of **`Node.js`** &/or **`npm`**, consider using a [node version manager](https://github.com/search?q=node+version+manager+archived%3Afalse&type=repositories&ref=advsearch).

## How to build and run the application

The following are the commands to run the application. After checking out the repo:

1. To install node dependencies: `npm install`. This will also install Maestro running automatically `npm run postinstall`.
2. To install playwright for testing: `npx playwright install --with-deps`. This will ask for sudo credentials on Ubuntu, but they are required to install dependencies to manage browser windows.
3. To run it: `npm run start`.
4. To run end-to-end tests: `npm run test:e2e`.
5. To run unit tests: `npm run test:unit`.
6. To run a syntax check: `npm run syntax`.
7. To build the app for a release: `npm run build`.
8. To build the app for a release for Windows and convert the executable in .msix: `npm run build:win`.

### Converting Windows executable to .msix

If `MsixPackagingTool.exe` is not found in your terminal with `npm run build:win`, try running `npm run build:win` on a Powershell with administrative rights.\
If `MsixPackagingTool.exe` is yet not recognised, look if the alias for `MsixPackagingTool.exe` and `MsixPackagingToolCLI.exe` are activated.\
If they are activated but it is still not working, follow these steps:

1. Run PowerShell as Administrator
2. Locate the installed folder for the tool with: `Get-ChildItem "C:\Program Files\WindowsApps" -Directory | Where-Object { $_.Name -like "Microsoft.MSIXPackagingTool_*" }`
3. Pick and copy one that looks like `Microsoft.MSIXPackagingTool_<version>_x64__8wekyb3d8bbwe`
4. Create a folder, i.e. C:\Tools, and create a Symbolic Link:

```bash
$tool = "Microsoft.MSIXPackagingTool_1.2024.405.0_x64__8wekyb3d8bbwe"
$target = "C:\Program Files\WindowsApps\$tool\MsixPackagingToolCLI.exe"
New-Item -ItemType Directory -Path "C:\Tools" -Force
New-Item -ItemType SymbolicLink -Path "C:\Tools\MsixPackagingTool.exe" -Target $target
```

5. Add C:\Tools to your PATH variables. Do it manually or use the following command: `[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Tools", [EnvironmentVariableTarget]::User)`
6. Restart the powershell and test if it is now working.

Please note that a terminal with administrative rights is needed, as the `MSIX Packaging Tool` is installed in the `WindowsApp` folder.

## Useful commands and properties

- `npm run clean`: cleans the working envorinment from different folders, making it ready for deploy or running for the first time.

## Latest builds

The master branch is built automatically on git pushes and the output, for successful builds. Please find the artifacts by clicking in the run [of the Package workflow](https://github.com/INTO-CPS-Association/into-cps-application/actions?query=workflow%3APackage).

These builds represent ongoing work. They have not been fully tested and are not guaranteed to work. Normally, you are advised to use one of the [releases](https://github.com/INTO-CPS-Association/into-cps-application/releases).
