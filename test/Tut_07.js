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
      env: { RUNNING_IN_SPECTRON: '1' },
      args: [path.join(__dirname, '..')]
    })

    fakeMenu.apply(this.app);

    await this.app.start();
    await this.app.client.waitUntilWindowLoaded();

    if (!(this.currentTest.title === 'File->Open Project Menu Click')) {

      await this.app.client.waitForVisible('#node_ProjectBrowserItem_4', 20000);

      await this.app.client.$('#node_ProjectBrowserItem_4').doubleClick();

      await this.app.client.waitUntilWindowLoaded();

      await this.app.client.waitForVisible('dse-page', 20000);

      await this.app.client.$('.panel-heading').click()

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
    return this.app;
  })

  // This should be done before as soon as we solve the programmatic project load problem
  it('Should have tutorial 7 loaded', function () {
    return this.app.client.waitUntilWindowLoaded()
      .then(function () {
        return this.electron.remote.app.getActiveProject().then(r => { expect(r).contain('Tutorial_7'); })

      })
  })

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
      .waitForVisible('.col-sm-7.col-md-8', 2000)
      .waitForVisible('.form-control-static', 2000)
      .$('.col-sm-7.col-md-8').$('.form-control-static').getText()
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

  //Page 9 and Page 11
  it('Adding two constraints and studentMap in the scenarios text box.', function () {
    return this.app.client
      .$('#btn-edit').click()
      .waitForVisible('#selectalg', 20000)
      .$('#selectalg').click()
      .waitForVisible('#Exhaustive', 20000)
      .$('#Exhaustive').click()

      .$('#AddConstraints').click()
      .$('#AddConstraints').click().pause(3000)

      .waitForVisible('#conparameter0')
      .waitForVisible('#conparameter1')
      .$('#conparameter0').setValue('{sensor1}.sensor1.lf_position_y == {sensor2FMU}.sensor2.lf_position_y')
      .$('#conparameter1').setValue('{sensor1}.sensor1.lf_position_x == - {sensor2FMU}.sensor2.lf_position_x')

      .waitForVisible('#scenarios0')
      .$('#scenarios0').getValue()
      .then(function (value) {
        assert.equal(value, 'studentMap')
      })
  })
})
