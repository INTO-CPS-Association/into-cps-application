const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
// needed so we can use as promised
chai.should();
chai.use(chaiAsPromised);

const app = require("./TestHelpers").app();
const path = require("path");
const testDataZipPath = path.resolve("test/TestData/test11_data.zip");
const testDataPath = path.resolve("test/TestData/test11_data");

describe('In Tutorial 11', function () {
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

  it('Should have tutorial 11 loaded', function () {
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
            .equal("ipp4cpps-project");
        });
  });

  it("Should open the mm to edit", function () {
    return app.client.$("#node_ProjectBrowserItem_13")
        .then(n => n.doubleClick())
        .then(() => app.client.$("#Configuration"))
        .then(n => n.click())
        .then(() => app.client.$('mm-configuration button.btn.btn-default'))
        .then(n => n.click())
        .then(() => app.client.$('button.btn.btn-default'))
        .then(n => n.getText())
        .should
        .eventually
        .contain("Save");
  });

  it("Set HMI FMU", function () {
    return app.client.$("#fmu0 file-browser input")
        .then(n => n.setValue("FMU_VDM_HMI.fmu"))
        .then(() => app.client.$("#fmu0 file-browser input"))
        .then(n => n.getValue())
        .should
        .eventually
        .equal("FMU_VDM_HMI.fmu");
  });
});