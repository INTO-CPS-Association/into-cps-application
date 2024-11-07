# Development environment documentation

## Required technologies and tools

- [Node Package Manager (NPM)](https://www.npmjs.com/package/npm): a package management system used to maintain packages used by the application. NPM 3 or higher is required.
- [Node.js](https://nodejs.org/) (v14.x is required).
- [React](https://react.dev)
- [Visual Studio Code](https://code.visualstudio.com/) is a good choice as an editor: it's cross-platform and is actually built on top of Electron. That said, everything can be used.

To manage multiple versions of **`Node.js`** &/or **`npm`**, consider using a [node version manager](https://github.com/search?q=node+version+manager+archived%3Afalse&type=repositories&ref=advsearch).

## How to build and run the application

The following are the commands to run the application. After checking out the repo:

1. To install node dependencies: `npm install`
2. To run it: `npm run start`
3. To run the tests: `npm test`
4. To run a syntax check: `npm run syntax`
5. To build the app for release: `npm run dist`

## Useful commands and properties

- `npm run clean`: cleans the working envorinment from different folders, making it ready to be deployed.

## Latest builds

The master branch is built automatically on git pushes and the output, for successful builds. Please find the artifacts by clicking in the run [of the Package workflow](https://github.com/INTO-CPS-Association/into-cps-application/actions?query=workflow%3APackage).

These builds represent ongoing work. They have not been fully tested and are not guaranteed to work. Normally, you are advised to use one of the [releases](https://github.com/INTO-CPS-Association/into-cps-application/releases).
