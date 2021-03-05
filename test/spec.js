const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
// needed so we can use as promised
chai.should();
chai.use(chaiAsPromised);
const expect = chai.expect;

const appVersion = require('../package.json').version;
const app = require("./TestHelpers").app();

const IntoCpsApp = require("../dist/IntoCpsApp").IntoCpsApp;

describe('Generic tests', function () {
  this.timeout(120000)

  before(async function () {
    return await app.start();
  })

  after(function () {
    if (app && app.isRunning())
      return app.stop();
  })

  it('Shows a window', function () {
    return app.client.waitUntilWindowLoaded().then(function () {
      app.client.getWindowCount().should.eventually.be.at.least(1);
    })
  })

  it('Shows a window with the correct title', function () {
    return app.client.getTitle().should.eventually.equal('INTO-CPS App')
  })

  // Maybe related to https://github.com/electron-userland/spectron/issues/815npm 
  xit('Displays the expected message in the window', function () {
    return app.client
        .getText('#mainView')
        .should.eventually.contain('Welcome to the INTO-CPS Application version ' + appVersion);
  })

  it("Test Global is 1", function() {
    return app.electron.remote.getGlobal("test").should.eventually.equal(1)
  })

  it("Loads Tutorial 1", function () {
    app.client.waitUntilWindowLoaded().then(async function (){
    await app.electron.remote.app.loadProject('/home/hdm/workspaces/into-cps-projects/tutorials/tutorial_1/.project.json');           
    });
  })


  it("App was created", function () {
    app.client.waitUntilWindowLoaded().then(async function (){
      console.log(IntoCpsApp)
      //console.log(IntoCpsApp.getInstance())
      console.log(await app.electron.remote.getGlobal("test"))
      console.log(await app.electron.remote.getGlobal("intoCpsApp"))

      IntoCpsApp.default.getInstance().loadProject("some/project/path")
    });
  })
})