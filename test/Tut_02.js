const Application = require('spectron').Application
const assert = require('assert')
const expect = require('chai').expect;
const electronPath = require('electron') // Require Electron from the binaries included in node_modules.
const path = require('path')
const fakeMenu = require('spectron-fake-menu')


describe.skip('In Tutorial 2', function () {
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

      await this.app.client.waitForVisible('#node_ProjectBrowserItem_21');

      await this.app.client.$('#node_ProjectBrowserItem_21').doubleClick();

      await this.app.client.waitUntilWindowLoaded();

      await this.app.client.waitForVisible('mm-page');

      await this.app.client.waitForVisible('#Configuration');

      await this.app.client.$('mm-page').$('#Configuration').click();

      await this.app.client.waitForVisible('.btn.btn-default');

      await this.app.client.$('.btn.btn-default').click();

      await this.app.client.waitForVisible('.btn.btn-default.btn-xs');

      await this.app.client.$('.btn.btn-default.btn-xs').click();
    }


    return this.app;

  })

  afterEach(function () {

    if (this.app && this.app.isRunning()) {

      return this.app.stop()
        .then(() => {
          if (this.currentTest.state === 'failed' && this.currentTest.title === 'Should have tutorial 2 loaded')
            throw Error("Tutorial 2 project is not loaded!")
        })
    }
  })

  //Step 2. To open a project, select File > Open Project
  it('File->Open Project Menu Click', function () {
    fakeMenu.clickMenu('File', 'Open Project');
    return this.app;
  })

  // This should be done before as soon as we solve the programmatic project load problem
  it.skip('Should have tutorial 2 loaded', function () {
    return this.app.client.waitUntilWindowLoaded()
      .then(function () {
        return this.electron.remote.app.getActiveProject().then(r => { expect(r).contain('tutorial_2'); })

      })
  })

  // /* Tutorial 2 */
  // //step 2,6,7,8
  it.skip('Add a new FMU entry from Configuration', function () {
    return this.app.client
      .waitForVisible('.form-control.input-fixed-size.input-sm.ng-untouched.ng-pristine.ng-valid')
      .$$('.form-control.input-fixed-size.input-sm.ng-untouched.ng-pristine.ng-valid')
      .then(function (text) {
        assert.equal(text.length, 6)   //length should be 5, I already added controller in the SE lecture therefore 6
      })
  })

  //step 9
  //TODO: Broken at merge form.get form.find
  it.skip('Rename the new entry to controller', function () {

    return this.app.client
      .waitForVisible('#fmu5')
      .$('#fmu5')
      .waitForVisible('#fmu')
      .$('#fmu').setValue("controller-test").pause(10000)
      .$('#fmu5').$('#fmu').getValue()
      .then(function (text) {
        assert.equal(text, 'controller-test')
      })
  })

  //step 10, 11
  //you need to 'cancel' manually 
  it.skip('Click File Button', function () {
    return this.app.client.$('#node_ProjectBrowserItem_21').doubleClick().pause(3000)
      .$('mm-page').$('#Configuration').click().pause(5000)
      .$('.btn.btn-default').click().pause(3000)
      .$('#fmu4').$('#file').click()
  })

  //step 14
  it.skip('Add an instance of controller', function () {
    return this.app.client.$('#node_ProjectBrowserItem_21').doubleClick().pause(3000)
      .$('mm-page').$('#Configuration').click().pause(2000)
      .$('.btn.btn-default').click().pause(2000)
      .$('#controller').click()
      .$('#fmu_instance').click()
      .$('#instance_fmu').getValue()
      .then(function (text) {
        assert.equal(text, 'controllerInstance')
      })
  })

  //step 15,16,17,18,19
  it.skip('Connect controller outputs to the body input', function () {
    return this.app.client.$('#node_ProjectBrowserItem_21').doubleClick().pause(3000)
      .$('mm-page').$('#Configuration').click().pause(2000)
      .$('.btn.btn-default').click().pause(2000)
      .$('#outputinstancecontrollerInstance').click().pause(2000)
      .$('#variableservoLeftVal').click().pause(2000)
      .$('#inputinstanceb').click().pause(2000)
      .$('#inputvariableservo_left_input').click()
      .$('#inputvariableservo_left_input').isSelected()
      .then(function (element) {
        assert.equal(element, true)
      })
  })

  //step 20,21,22,23
  it.skip('Set the initial values of parameters of the controller', function () {
    return this.app.client.$('#node_ProjectBrowserItem_21').doubleClick().pause(3000)
      .$('mm-page').$('#Configuration').click().pause(2000)
      .$('.btn.btn-default').click().pause(2000)
      .$('#initialvalcontrollerInstance').click()
      .$('#addParameters').click().pause(2000)
      .$('#backwardRotate').setValue('0.1')
      .$('#addParameters').click().pause(2000)
      .$('#forwardRotate').setValue('0.5')
      .$('#addParameters').click().pause(2000)
      .$('#forwardSpeed').setValue('0.4')
      .$('#forwardSpeed').getValue()
      .then(function (value) {
        assert.equal(value, "0.4");
      })
  })

  //step 24
  it.skip('Right-click on the multi-model configuration and create Co-simulation Configuration', function () {
    return this.app.client.$('#node_ProjectBrowserItem_21').rightClick()
      .$('.w2ui-icon.glyphicon.glyphicon-copyright-mark').click().pause(3000)
      .$('#Ok').click().pause(2000)
      .getText('#activeTabTitle')
      .then(function (title) {
        expect(title).contain('3DRobot')
      })
  })

  //step 25
  it.skip('Edit Step Size to 0.01 under Basic Configuration', function () {
    return this.app.client.$('#node_ProjectBrowserItem_21').rightClick()
      .$('.w2ui-icon.glyphicon.glyphicon-copyright-mark').click().pause(3000)
      .$('#Ok').click().pause(2000)
      .$('coe-page').$('.panel-heading').click()
      .$('.btn.btn-default').click()
      .$('#stepsize').setValue('0.01')
      .$('.btn.btn-default').click().pause(2000)
      .$('#notediting').getText()
      .then(function (value) {
        assert.equal(value, "0.01")
      })
  })

  //step 26, 27
  it.skip('Live plotting', function () {
    return this.app.client.$('#node_ProjectBrowserItem_21').rightClick()
      .$('.w2ui-icon.glyphicon.glyphicon-copyright-mark').click().pause(3000)
      .$('#Ok').click().pause(3000)
      .$('coe-page').$('.panel-heading').click().pause(2000)
      .$('.btn.btn-default').click().pause(2000)
      .$('#livecollapse').click().pause(2000)
      .$('#addLiveGraph').click()
      .$('#sensor1lf_1_sensor_reading').click()
      .$('#sensor2lf_1_sensor_reading').click()
      .$('#sensor1lf_1_sensor_reading').isSelected()
      .then(function (element) {
        assert.equal(element, true)
      })
  })
})