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
  xit('File->Import example project Menu Click', function () {                    //Not working
    fakeMenu.clickMenu('File', 'Import Example Project')
    return this.app;
  })

  xit('File->Import example project Menu Click', async function () {              //Not working
    await this.app.client.waitUntilWindowLoaded();

    await this.app.client.execute(() => {
      var menu = this.electron.remote.Menu.getApplicationMenu();
      menu.getItemByNames('File', 'Import Example Project').click();
    });

})

xit('File->Import example project Menu Click', function () {                      //Not working
  return this.app.client.waitUntilWindowLoaded()
      .then(function () {
        return this.electron.remote.Menu.getApplicationMenu().then(r => {  r.getItemByNames('File', 'Import Example Project').click(); })

      })
})

  // This should be done before as soon as we solve the programmatic project load problem
  xit('Should have line follower robot loaded', function () {
    return this.app.client.waitUntilWindowLoaded()
      .then(function () {
        return this.electron.remote.app.getActiveProject().then(r => { expect(r).contain('tutorial_9'); })

      })
  })

  //Step 35
  //Manually cancel or select the fmu file
  xit('Add the new FMU instead of the overture FMU', function(){
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