# Development environment documentation

## Required technologies and toolsù

- [Node Package Manager (NPM)](https://www.npmjs.com/package/npm): a package management system used to maintain packages used by the application. NPM 3 or higher is required.
- [Node.js](https://nodejs.org/) (v14.x is required).
- [Gulp](https://gulpjs.com/docs/en/getting-started/quick-start): a build system used to build the application.
- [Visual Studio Code](https://code.visualstudio.com/) is a good choice as an editor: it's cross-platform and is actually built on top of Electron. That said, everything can be used.

To manage multiple versions of **`Node.js`** &/or **`npm`**, consider using a [node version manager](https://github.com/search?q=node+version+manager+archived%3Afalse&type=repositories&ref=advsearch).

## How to build and run the application

The following are the commands to run the application. After checking out the repo:

1. To install node dependencies:  `npm install`
2. To install gulp: `npm install -g gulp` (it's easiest to have it installed globally)
3. To build the UI:  `gulp` or `gulp build`
4. To run it:  `npm start`
5. To run tests: `npm test`
6. To build the application for the release: `npm run dist` or `npm run dist:win` for Windows only. Please note that it's required to run the `gulp` command first.

## Useful commands and properties

- `gulp watch`: it will automatically detect when you save a file and run the corresponding build task so you only have to refresh the app when developing.
- `npm run clean`: cleans the working envorinment from different folders, making it ready to be deployed.

## Latest builds

The master branch is built automatically on git pushes and the output, for successful builds. Please find the artifacts by clicking in the run [of the Package workflow](https://github.com/INTO-CPS-Association/into-cps-application/actions?query=workflow%3APackage).

These builds represent ongoing work. They have not been fully tested and are not guaranteed to work. Normally, you are advised to use one of the [releases](https://github.com/INTO-CPS-Association/into-cps-application/releases).
