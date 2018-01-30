intocps-ui
---

The INTO-CPS Application is the frontend of the INTO-CPS Tool Chain. It is used
to configure and run FMI-based co-simulations. Other features include model
checking, test automation and design space exploration.

The App is primarily a UI. Most of the modelling and simulation work is done by
the INTO-CPS tools themselves. These can be downloaded from within the app.

![The INTO-CPS Application](src/resources/screenshot.png?raw=true "The INTO-CPS App")


How to build
---
The app is built with [Electron](http://electron.atom.io/) and
[Node.js](https://nodejs.org/) (v6 recommended). You need npm (comes with Node.js). Npm 3 or higher is required. Npm
can be upgraded with `npm install npm@latest -g`. We use Gulp to manage tasks. It's easiest to have it installed globally (`npm install -g gulp`). 

After checking out the repo...

1. To install node dependencies: `npm install`
2. To install other resources: `gulp init`
3. To build the UI: `gulp`
4. To run it: `npm start`


Development
---
For an editor, [Visual Studio Code](https://code.visualstudio.com/) is a good choice. It's
cross-platform and is actually built on top of Electron. That said, you can use
whatever you want.

Further developer info is available in https://github.com/into-cps/intocps-ui/wiki

Latest builds
---
The master branch is built automatically on git pushes and the output, for
successful builds, is uploaded to: http://overture.au.dk/into-cps/into-cps-app/master/latest/

These builds represent ongoing work. They have not been fully tested and are
not guaranteed to work. Normally, you are advised to use one of the
[releases](https://github.com/into-cps/intocps-ui/releases) .


About
---
INTO-CPS is an EU Horizon 2020 research project that is creating an integrated
tool chain for comprehensive Model-Based Design of Cyber-Physical Systems.  For
more, see: http://into-cps.au.dk/

