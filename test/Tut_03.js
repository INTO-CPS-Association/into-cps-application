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

const app = require("./TestHelpers").app();
const path = require("path");
const testDataZipPath = path.resolve("test/TestData/test3_data.zip");
const testDataPath = path.resolve("test/TestData/test3_data");

describe('In Tutorial 3', function () {
  // beforeEach(async function () {
  //   if (this.currentTest.title === 'Open mm-3DRobot configuration and click on File button next to c' || this.currentTest.title == 'Defining the sensor positions') {
  //
  //     await this.app.client.$('#node_ProjectBrowserItem_21').doubleClick();
  //
  //     await this.app.client.waitUntilWindowLoaded();
  //
  //     await this.app.client.waitForVisible('#Configuration');
  //
  //     await this.app.client.$('mm-page').$('#Configuration').click();
  //
  //     await this.app.client.waitForVisible('.btn.btn-default');
  //
  //     await this.app.client.$('.btn.btn-default').click(); //until step 27 where Edit Button is clicked
  //   }
  // })

  this.timeout(120000)

  before(async function () {

    await app.start();
    await app.client.waitUntilWindowLoaded();

    await require("./TestHelpers").unZipTestData(testDataZipPath, testDataPath);
    await app.electron.remote.app.loadProject(testDataPath + "/testdata/.project.json");

    return app;
  });

  after(function () {
    // return require("./TestHelpers").commonShutdownTasks(app);
    return require("./TestHelpers").commonShutdownTasks(app, testDataPath);
  });

  it('Should have tutorial 3 loaded', function () {
    return app.electron.remote.app.getActiveProject()
        .should
        .eventually
        .equal(testDataPath + "/testdata/.project.json");
  });

  it("Should have the correct name", function () {
    return app.electron.remote.app.getIProject()
        .then(n => { return n
            .name
            .should
            .equal("INTO-CPS_Tutorial");
        });
  });

  it("Right click on 3D Robot", function () {
    return app.client.$("#node_ProjectBrowserItem_22 .w2ui-expand")
        .then(n => n.click())
        .then(() => app.client.$("#node_ProjectBrowserItem_24 .w2ui-expand"))
        .then(n => n.click())
        .then(() => app.client.$("#node_ProjectBrowserItem_28"))
        .then(n => n.click({button: "right"}))
        .then(() => app.client.$("#w2ui-overlay tbody"))
        .then(n => n.getText())
        .should
        .eventually
        .contain("Create Multi-Model");
  });

  it("Should be able to open MM creation popup from right click", function () {
    return app.client.$("#w2ui-overlay tbody")
        .then(n => n.$$("tr"))
        .then(n => n[0].click())
        .then(() => app.client.$("#w2ui-popup div.w2ui-popup-title"))
        .then(n => n.getText())
        .should
        .eventually
        .contain("New Multi-Model")
  });

  it('Create MM through popup with name mm-3DRobot', function () {
    return app.client.$("#w2prompt")
        .then(n => n.setValue("mm-3DRobot"))
        .then(() => app.client.$("#w2ui-popup #Ok"))
        .then(n => n.click())
        .then(() => app.client.$("#activeTabTitle"))
        .then(n => n.getText())
        .should
        .eventually
        .contain("mm-3DRobot");
  });


  //Step 31
  // TODO: Need to repeat this 
  xit('Defining the sensor positions', function () {
    return this.app.client
      .waitForVisible('#initialvalsensor1')
      .$('#initialvalsensor1').click()

      .waitForVisible('#lf_position_y')
      .$('#lf_position_y').setValue('0.065')

      .waitForVisible('#lf_position_x')
      .$('#lf_position_x').setValue('0.001').pause(2000)
      .$('#lf_position_x').getValue()
      .then(function (text) {
        assert.equal(text, '0.001')
      })
  })

  //Step 34,35
  xit('Right-click on the mm and select Create Co-Simulation Configuration', function () {
    return this.app.client.$('#node_ProjectBrowserItem_21').rightClick()
      .waitForVisible('#td1')
      .$('#td1').click()
      .$('#Ok').click()
      .waitUntilWindowLoaded()

      .$('.panel-heading').click()

      .waitForVisible('.btn.btn-default')
      .$('.btn.btn-default').click()

      .waitForVisible('#stepsize')
      .$('#stepsize').setValue('0.01').pause(2000)
      .$('#stepsize').getValue()
      .then(function (value) {
        assert.equal(value, '0.01')
      })
  })
});
