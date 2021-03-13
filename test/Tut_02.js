// const Application = require('spectron').Application
// const assert = require('assert')
// const expect = require('chai').expect;
// const electronPath = require('electron') // Require Electron from the binaries included in node_modules.
// const path = require('path')
const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
const chaiWaitFor = require('chai-wait-for');
// needed so we can use as promised
chai.should();
chai.use(chaiAsPromised);
chai.use(chaiWaitFor);

const waitFor = chaiWaitFor.bindWaitFor({
  timeout: 5000,
  retryInterval: 100
});

const app = require("./TestHelpers").app();
const path = require("path");
const testDataZipPath = path.resolve("test/TestData/test2_data.zip");
const testDataPath = path.resolve("test/TestData/test2_data");

describe('In Tutorial 2', function () {
  this.timeout(120000)

  before(async function () {

    await app.start();
    await app.client.waitUntilWindowLoaded();

    await app.electron.remote.app.loadProject(testDataPath + "/.project.json");

    return app;
  })

  after(function () {
    // return require("./TestHelpers").commonShutdownTasks(app);
    // return require("./TestHelpers").commonShutdownTasks(app, testDataPath);
  })

  // This should be done before as soon as we solve the programmatic project load problem
  it('Should have tutorial 2 loaded', function () {
    return app.electron.remote.app.getActiveProject()
        .should
        .eventually
        .equal(testDataPath + "/.project.json");
  })

  it("Should have the correct name", function() {
    return app.electron.remote.app.getIProject()
        .then(n => {
          return n
              .name
              .should
              .equal("INTO-CPS_Tutorial");
        });
  })

  // /* Tutorial 2 */
  it("Should be able to open MM", function() {
    return app.client.$('#node_ProjectBrowserItem_21')
        .then(n => n.doubleClick())
        .then(() => {
          return app.client.$("#activeTabTitle")
              .then(n => n.getText())
              .should
              .eventually
              .equal("mm-3DRobot");
        });
  });

  it("Should be able to open the Configuration pane", function() {
    return app.client.$("#Configuration")
        .then(n => n.click())
        .then(() => {
          return app.client.$("mm-configuration")
              .then(n => n.elementId
                  .should
                  .contain("-"));
        });
  })

  it("Should be able to click edit button", function() {
    return app.client.$('button.btn.btn-default')
        .then(n => n.click())
        .then(() => {
          return app.client.$('button.btn.btn-default')
              .then(n => n.getText())
              .should
              .eventually
              .contain("Save");
        });
  })

  it("Should be able to add a new FMU", function() {
    return app.client.$("#fmu5")
        .then(n => n.elementId)
        .then(n => expect(n).to.equal(undefined))
        .then(() => {
          return app.client.$('button.btn.btn-default.btn-xs') // the + button in the config section
              .then(n => n.click())
              .then(() => {
                return app.client.$("#fmu5")
                    .then(n => n.elementId)
                    .then(n => expect(n).to.contain("-"))
              });
        });
  })

  it('Add a new FMU entry from Configuration', function () {
    return app.client.$("#fmu5 #fmu")
        .then(n => n.getValue())
        .should
        .eventually
        .equal("FMU");
  })

  it('Rename the new entry to controller', function () {
    return app.client.$("#fmu5 #fmu")
        .then(n => n.setValue("controller-test"))
        .then(() => {
          return app.client.$("#fmu5 #fmu")
              .then(n => n.getValue())
              .should
              .eventually
              .equal("controller-test");
        })
  })

  it('Remove Test FMU', function () {
      return app.client.$("#fmu5 .col-md-1 button")
          .then(n => n.click())
          .then(() => {
              return app.client.$("#fmu5")
                  .then(() => {
                      return app.client.$("#fmu5")
                          .then(n => n.elementId)
                          .then(n => expect(n).to.equal(undefined));
                  });
          });
  });

  it("Can click on FMU instances", function() {
      return app.client.$("#controller")
          .then(n => n.click())
          .then(() => {
              return app.client.$("#instance_fmu")
                  .then(n => n.getValue())
                  .should
                  .eventually
                  .contain("controllerInstance");
          });
  });

  //step 14
  it.skip('Add an instance of controller', function () {
    // return this.app.client.$('#node_ProjectBrowserItem_21').doubleClick().pause(3000)
    //   .$('mm-page').$('#Configuration').click().pause(2000)
    //   .$('.btn.btn-default').click().pause(2000)
    //   .$('#controller').click()
    //   .$('#fmu_instance').click()
    //   .$('#instance_fmu').getValue()
    //   .then(function (text) {
    //     assert.equal(text, 'controllerInstance')
    //   })
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
});