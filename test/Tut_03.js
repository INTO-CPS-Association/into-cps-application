const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
// needed so we can use as promised
chai.should();
chai.use(chaiAsPromised);

const app = require("./TestHelpers").app();
const path = require("path");
const testDataZipPath = path.resolve("test/TestData/test3_data.zip");
const testDataPath = path.resolve("test/TestData/test3_data");

describe('In Tutorial 3', function () {
  this.timeout(120000)

  before(async function () {

    await app.start();
    await app.client.waitUntilWindowLoaded();

    await require("./TestHelpers").unZipTestData(testDataZipPath, testDataPath);
    await app.electron.remote.app.loadProject(testDataPath + "/project/.project.json");

    return app;
  });

  after(function () {
    return require("./TestHelpers").commonShutdownTasks(app, testDataPath);
  });

  it('Should have tutorial 3 loaded', function () {
    return app.electron.remote.app.getActiveProject()
        .should
        .eventually
        .equal(testDataPath + "/project/.project.json");
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
        .then(async n => await n.waitForExist(3000))
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

  it("Open configuration to edit", function () {
    return app.client.$("#Configuration")
        .then(n => n.click())
        .then(() => app.client.$('button.btn.btn-default'))
        .then(n => n.click())
        .then(() => app.client.$('button.btn.btn-default'))
        .then(n => n.getText())
        .should
        .eventually
        .contain("Save");
  });

  it("Should contain errors as FMU paths are not defined", function () {
    return app.client.$$(".alert.alert-warning.alert-big")
        .then(n => n.length)
        .should
        .eventually
        .be
        .greaterThan(0);
  });

  it("Should set the Path for c (Controller)", function () {
    return app.client.$("#fmu0 file-browser input")
        .then(n => n.setValue("LFRController.fmu"))
        .then(() => app.client.$("#fmu0 file-browser input"))
        .then(n => n.getValue())
        .should
        .eventually
        .contain("LFRController.fmu");
  });

  it("Should set the Path for b (Body)", function () {
    return app.client.$("#fmu1 file-browser input")
        .then(n => n.setValue("Body_Block.fmu"))
        .then(() => app.client.$("#fmu1 file-browser input"))
        .then(n => n.getValue())
        .should
        .eventually
        .contain("Body_Block.fmu");
  });

  it("Should set the Path for 3D (3D Animation)", function () {
    return app.client.$("#fmu2 file-browser input")
        .then(n => n.setValue("3DanimationFMU.fmu"))
        .then(() => app.client.$("#fmu2 file-browser input"))
        .then(n => n.getValue())
        .should
        .eventually
        .contain("3DanimationFMU.fmu");
  });

  it("Should set the Path for sensor1", function () {
    return app.client.$("#fmu3 file-browser input")
        .then(n => n.setValue("Sensor_Block_01.fmu"))
        .then(() => app.client.$("#fmu3 file-browser input"))
        .then(n => n.getValue())
        .should
        .eventually
        .contain("Sensor_Block_01.fmu");
  });

  it("Should set the Path for sensor2", function () {
    return app.client.$("#fmu4 file-browser input")
        .then(n => n.setValue("Sensor_Block_02.fmu"))
        .then(() => app.client.$("#fmu4 file-browser input"))
        .then(n => n.getValue())
        .should
        .eventually
        .contain("Sensor_Block_02.fmu");
  });

  it("Should be able to save configuration", function () {
    return app.client.$('button.btn.btn-default')
        .then(n => n.click())
        .then(() => app.client.$('button.btn.btn-default'))
        .then(n => n.getText())
        .should
        .eventually
        .contain("Edit");
  });

  it("Set sensor1 y position", function() {
    return app.client.$('button.btn.btn-default')
        .then(n => n.click())
        .then(() => app.client.$("#initialvalsensor1"))
        .then(n => n.click())
        .then(() => app.client.$("#lf_position_y"))
        .then(n => n.addValue(0.065)) // setValue for some reason does not work in this context
        .then(() => app.client.$("#lf_position_y"))
        .then(n => n.getValue())
        .should
        .eventually
        .equal("00.065");
  });

  it("Should save with no errors", function() {
    return app.client.$('button.btn.btn-default')
        .then(n => n.click())
        .then(app.client.$$(".alert.alert-warning.alert-big"))
        .should
        .eventually
        .be
        .null;
  });

  it("Creat a a Co-Sim from the MM", function () {
    return app.client.$("#node_ProjectBrowserItem_35")
        .then(n => n.click({button: "right"}))
        .then(() => app.client.$("#w2ui-overlay tbody"))
        .then(n => n.$$("tr"))
        .then(n => n[1].click())
        .then(() => app.client.$("#w2ui-popup #Ok"))
        .then(n => n.click())
        .then(() => app.client.$("#activeTabTitle"))
        .then(n => n.getText())
        .should
        .eventually
        .equal("mm-3DRobot > co-sim");
  });
});