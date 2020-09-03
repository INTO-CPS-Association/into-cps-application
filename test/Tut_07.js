const Application = require('spectron').Application
const assert = require('assert')
const expect = require('chai').expect;
const electronPath = require('electron') // Require Electron from the binaries included in node_modules.
const path = require('path')
const fakeMenu = require('spectron-fake-menu')


describe.skip('In Tutorial 7', function () {
  this.timeout(120000)



  beforeEach(async function () {

    this.app = new Application({
      path: electronPath,
      args: [path.join(__dirname, '..')]
    })

    fakeMenu.apply(this.app);

    await this.app.start();
    await this.app.client.waitUntilWindowLoaded();

    if (!(this.currentTest.title === 'File->Open Project Menu Click')) {

      await this.app.client.waitForVisible('#node_ProjectBrowserItem_4', 20000);

      await this.app.client.$('#node_ProjectBrowserItem_4').doubleClick();

      await this.app.client.waitUntilWindowLoaded();

      await this.app.client.waitForVisible('#dse-configuration', 20000);

      await this.app.client.$('#dse-configuration').click()

      await this.app.client.waitForVisible('.btn.btn-default', 20000);

      await this.app.client.$('dse-configuration').$('.btn.btn-default').click()

      await this.app.client.waitForVisible('.form-control.ng-untouched.ng-pristine.ng-valid', 20000);

      await this.app.client.$('.form-control.ng-untouched.ng-pristine.ng-valid').selectByVisibleText('Experiment | lfr-non3d');

      await this.app.client.$('.btn.btn-default').click();
    }


    return this.app;

  })

  afterEach(function () {

    if (this.app && this.app.isRunning()) {

      return this.app.stop()
        .then(() => {
          if (this.currentTest.state === 'failed' && this.currentTest.title === 'Should have tutorial 7 loaded')
            throw Error("Tutorial 7 project is not loaded!")
        })
    }
  })

  //Step 2. To open a project, select File > Open Project
  it('File->Open Project Menu Click', function () {
    fakeMenu.clickMenu('File', 'Open Project');
  })

  // This should be done before as soon as we solve the programmatic project load problem
  it('Should have tutorial 7 loaded', function () {
    return this.app.client.waitUntilWindowLoaded()
      .getMainProcessLogs().then(function (logs) {
        // For test debugging processes uncomment the following line
        // console.log(logs)
        expect(logs[25]).contain('tutorial_7/.project.json');
      })
  })

  /* Tutorial 7 */
  // step 2 Opening a DSE Configuration
  it('Select the Experiment/lfr-non3d multi model', function () {
    return this.app.client
      .$('.btn.btn-default').click()
      .waitForVisible('.form-control.ng-untouched.ng-pristine.ng-valid', 20000)
      .$('.form-control.ng-untouched.ng-pristine.ng-valid').selectByVisibleText('Experiment | lfr-non3d')
      .getText('option:checked')
      .then(function (text) {
        expect(text).contain("lfr-non3d")
      })
  })

  it('Select the Experiment/lfr-non3d multi model and click save', function () {
    return this.app.client.$('.form-control-static').getText()
      .then(function (text) {
        expect(text).contain("lfr-non3d | Multi-models")
      })
  })

  it('algorithm choice Exhaustive showing after multi-model is set ', function () {
    return this.app.client
      .$('.btn.btn-default').click()
      .waitForVisible('.col-sm-7.col-md-8')
      .$('.col-sm-7.col-md-8')
      .waitForVisible('.form-control-static')
      .$('.form-control-static').getText()
      .then(function (text) {
        expect(text).contain("Exhaustive")
      })
  })

  it('Switching into editing mode from the top of the DSE configuration by clicking on Edit button ', function () {
    return this.app.client
      .$('#btn-edit').click().pause(3000)
      .$('#btn-save').getText()
      .then(function (text) {
        assert.equal(text, "Save")
      })
  })


})