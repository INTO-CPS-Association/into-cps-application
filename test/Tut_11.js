const Application = require('spectron').Application
const assert = require('assert')
const expect = require('chai').expect;
const electronPath = require('electron') // Require Electron from the binaries included in node_modules.
const path = require('path')
const fakeMenu = require('spectron-fake-menu')


describe.skip('In Tutorial 11', function () {
  this.timeout(120000)



  beforeEach(async function () {

    this.app = new Application({
      path: electronPath,
      env: { RUNNING_IN_SPECTRON: '1' },
      args: [path.join(__dirname, '..')]
    })

    fakeMenu.apply(this.app);

    await this.app.start();
    await this.app.client.waitUntilWindowLoaded();

    return this.app;

  })

  afterEach(function () {

    if (this.app && this.app.isRunning()) {

      return this.app.stop()
        .then(() => {
          if (this.currentTest.state === 'failed' && this.currentTest.title === 'Should have line follower robot loaded')
            throw Error("Line follower robot is not loaded!")
        })
    }
  })

  //Step 33
  //Manually select the line follower robot case study
  it('File->Import example project Menu Click', function () {                   
    fakeMenu.clickMenu('File', 'Import Example Project')
    return this.app.client.pause(20000);
  })

  // This should be done before as soon as we solve the programmatic project load problem
  it('Should have line follower robot loaded', function () {
    return this.app.client.waitUntilWindowLoaded()
      .then(function () {
        return this.electron.remote.app.getActiveProject().then(r => { expect(r).contain('example-line_follower_robot'); })

      })
  })

  //Step 35
  //Manually cancel or select the fmu file
  it('Add the new FMU instead of the overture FMU', function(){
      return this.app.client
      .waitForVisible('#node_ProjectBrowserItem_76')
      .$('#node_ProjectBrowserItem_76').doubleClick()

      .waitUntilWindowLoaded()
      .waitForVisible('#Configuration')
      .$('mm-page').$('#Configuration').click()
      .waitForVisible('.btn.btn-default')
      .$('.btn.btn-default').click()

      .waitForVisible('#fmu0')
      .waitForVisible('#file')
      .$('#fmu0').$('#file').click().pause(3000);
  })
})