const Application = require('spectron').Application
const assert = require('assert')
const expect = require('chai').expect;
const electronPath = require('electron') // Require Electron from the binaries included in node_modules.
const path = require('path')
const fakeMenu = require('spectron-fake-menu')


describe.skip('In Tutorial 9', function () {
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
          if (this.currentTest.state === 'failed' && this.currentTest.title === 'Should have tutorial 9 loaded')
            throw Error("Tutorial 9 project is not loaded!")
        })
    }
  })

  //Step 2. To open a project, select File > Open Project
  it('File->Open Project Menu Click', function () {
    fakeMenu.clickMenu('File', 'Open Project');
    return this.app;
  })

  // This should be done before as soon as we solve the programmatic project load problem
  it('Should have tutorial 9 loaded', function () {
    return this.app.client.waitUntilWindowLoaded()
      .then(function () {
        return this.electron.remote.app.getActiveProject().then(r => { expect(r).contain('tutorial_9'); })

      })
  })

  //Step 10
  it('co-simulate with the lfr-3d multi-model', function(){
    return this.app.client
    .waitForVisible('#node_ProjectBrowserItem_44')
    .waitForVisible('.w2ui-expand')
    .$('#node_ProjectBrowserItem_44').$('.w2ui-expand').click()

    .waitForVisible('#node_ProjectBrowserItem_45')
    .$('#node_ProjectBrowserItem_45').doubleClick()

    .waitForVisible('#Simulation')
    .$('#Simulation').click()
    .$('coe-simulation').$('.btn.btn-sm.btn-default').click().pause(3000)
    .$('.alert.alert-success').click().pause(3000)
    .$('.alert.alert-success').getText()
    .then(function (text) {
      expect(text).contain('online')
     })
  })


  //Step 15 and Step 20
  it('setting the sensor noise value to 4 and ambient light to 25', function(){
    return this.app.client
    .waitForVisible('#node_ProjectBrowserItem_47')
    .$('#node_ProjectBrowserItem_47').doubleClick()
    .$('mm-page').$('#Configuration').click().pause(3000)

    .waitForVisible('.btn.btn-default')
    .$('.btn.btn-default').click().pause(3000)

    .waitForVisible('#initialvalsensor1')
    .$('#initialvalsensor1').click().pause(2000)
    .$('#ambient_light').addValue(25)
 
    .waitForVisible('#initialvalsensor2')
    .$('#initialvalsensor2').click().pause(2000)
    .$('#ambient_light').addValue(25)

    .waitForVisible('#initialvalsensor1')
    .$('#initialvalsensor1').click().pause(2000)
    .$('#noise_level').addValue(4)

    .waitForVisible('#initialvalsensor2')
    .$('#initialvalsensor2').click().pause(2000)
    .$('#noise_level').addValue(4)

    
    .$('.btn.btn-default').click()
    .$('.btn.btn-default').getText()
    .then(function(ButtonText){
      assert.equal(ButtonText, "Edit")
    })
  })
})