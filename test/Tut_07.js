const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
// needed so we can use as promised
chai.should();
chai.use(chaiAsPromised);

const app = require("./TestHelpers").app();
const path = require("path");
const testDataZipPath = path.resolve("test/TestData/test7_data.zip");
const testDataPath = path.resolve("test/TestData/test7_data");

describe('In Tutorial 7', function () {
  this.timeout(120000)

  before(async function () {
    await app.start();
    await app.client.waitUntilWindowLoaded();
    require("./TestHelpers").unZipTestData(testDataZipPath, testDataPath);
    await app.electron.remote.app.loadProject(testDataPath + "/project/.project.json");

    return app;
  });

  after(function () {
    return require("./TestHelpers").commonShutdownTasks(app, testDataPath);
  });

  // This should be done before as soon as we solve the programmatic project load problem
  it('Should have tutorial 7 loaded', function () {
    return app.electron.remote.app.getActiveProject()
        .should
        .eventually
        .equal(testDataPath + "/project/.project.json");
  })

  it("Should have the correct name", function () {
    return app.electron.remote.app.getIProject()
        .then(n => n.name)
        .should
        .eventually
        .equal("")
  });

  it("Open DSE Page", function () {
    return app.client.$("#node_ProjectBrowserItem_3")
        .then(n => n.doubleClick())
        .then(() => app.client.$("#activeTabTitle"))
        .then(n => n.getText())
        .should
        .eventually
        .contain("dse-DSE Example-78");
  });

  it("Should open configuration", function () {
    return app.client.$('.panel-heading')
        .then(n => n.click())
        .then(() => app.client.$('dse-configuration'))
        .should
        .eventually
        .have
        .property("elementId");
  });

  it("Should be able to edit DSE configuration", function () {
    return app.client.$("dse-configuration .btn.btn-default")
        .then(n => n.click())
        .then(() => app.client.$("dse-configuration .btn.btn-default"))
        .then(n => n.getText())
        .should
        .eventually
        .contain("Save");
  });

  // step 2 Opening a DSE Configuration
  it('Select the Experiment/lfr-non3d multi model', function () {
    return app.client.$("select.form-control.ng-untouched.ng-pristine.ng-valid")
        .then(n => n.selectByVisibleText('Experiment | lfr-non3d'))
        .then(() => app.client.$("select.form-control.ng-valid.ng-dirty"))
        .then(n => n.getText())
        .should
        .eventually
        .contain("lfr-non3d");
  });

  it("Set algorithm to exhaustive", function () {
    return app.client.$("div.col-sm-7.col-md-8>select.form-control.ng-untouched.ng-pristine.ng-valid")
        .then(n => n.selectByVisibleText("Exhaustive"))
        .then(() => app.client.$("div.col-sm-7.col-md-8>select.form-control.ng-valid.ng-dirty"))
        .then(n => n.getText())
        .should
        .eventually
        .contain("Exhaustive");
  });

  it("Should add a constraint on the y position", function () {
    return app.client.$("#AddConstraints")
        .then(n => n.click())
        .then(() => app.client.$("#conparameter0"))
        .then(n => n.setValue("{sensor1}.sensor1.lf_position_y == {sensor2FMU}.sensor2.lf_position_y"))
        .then(() => app.client.$("#conparameter0"))
        .then(n => n.getValue())
        .should
        .eventually
        .equal("{sensor1}.sensor1.lf_position_y == {sensor2FMU}.sensor2.lf_position_y")
  });

  it("Should add a constraint on the x position", function () {
    return app.client.$("#AddConstraints")
        .then(n => n.click())
        .then(() => app.client.$("#conparameter1"))
        .then(n => n.setValue("{sensor1}.sensor1.lf_position_x == - {sensor2FMU}.sensor2.lf_position_x"))
        .then(() => app.client.$("#conparameter1"))
        .then(n => n.getValue())
        .should
        .eventually
        .equal("{sensor1}.sensor1.lf_position_x == - {sensor2FMU}.sensor2.lf_position_x")
  });

  it("Should set studentMap in the scenario", function () {
    return app.client.$("#scenarios0")
        .then(n => n.setValue("studentMap"))
        .then(() => app.client.$("#scenarios0"))
        .then(n => n.getValue())
        .should
        .eventually
        .equal("studentMap");
  });

  it("Should be able to save the configuration", function () {
    return app.client.$("dse-configuration .btn.btn-default")
        .then(n => n.click())
        .then(() => app.client.$("dse-configuration .btn.btn-default"))
        .then(n => n.getText())
        .should
        .eventually
        .contain("Edit");
  });
});