const chai = require('chai');
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
const testDataZipPath = path.resolve("test/TestData/test9_data.zip");
const testDataPath = path.resolve("test/TestData/test9_data");

describe('In Tutorial 9', function () {
  this.timeout(120000)

  before(async function () {
    await app.start();
    await app.client.waitUntilWindowLoaded();
    require("./TestHelpers").unZipTestData(testDataZipPath, testDataPath);
    await app.electron.remote.app.loadProject(testDataPath + "/project/.project.json");

    await require("./TestHelpers").downloadCOE(app);

    return app;
  });

  after(function () {
    require("./TestHelpers").deleteCOE(app);
    return require("./TestHelpers").commonShutdownTasks(app, testDataPath);
  });

  // This should be done before as soon as we solve the programmatic project load problem
  it('Should have tutorial 9 loaded', function () {
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

  it("Should be able to start COE from lfr-3d multi-model", function () {
    return app.client.$("#node_ProjectBrowserItem_11 .w2ui-expand")
        .then(n => n.click())
        .then(() => app.client.$("#node_ProjectBrowserItem_12"))
        .then(n => n.doubleClick())
        .then(() => app.client.$("#Simulation"))
        .then(n => n.click())
        .then(() => app.client.$("coe-simulation .btn.btn-sm.btn-default"))
        .then(n => n.click())
        .then(() => sleep(100))
        .then(() => app.client.$("coe-simulation"))
        .then(n => n.$(".alert.alert-success"))
        .then(async n => {
          return waitFor(await n.getText())
              .to
              .match(/Co-Simulation Engine, .+, online at .+\./);
        });
  });

  it("Should open lfr-non3d", function () {
    return app.client.$("#node_ProjectBrowserItem_14")
        .then(n => n.doubleClick())
        .then(() => app.client.$("#activeTabTitle"))
        .then(n => n.getText())
        .should
        .eventually
        .equal("lfr-non3d");
  });

  it("Should open edit mode of the mm", function () {
    return app.client.$('#Configuration')
        .then(n => n.click()).then(() => sleep(100))
        .then(() => app.client.$('mm-configuration button.btn.btn-default'))
        .then(n => n.click()).then(() => sleep(100))
        .then(() => app.client.$('button.btn.btn-default'))
        .then(n => n.getText())
        .should
        .eventually
        .contain("Save");
  });

  it("Should set ambient light for sensor 1", function () {
    return sleep(100)
        .then(() => app.client.$("#initialvalsensor1"))
        .then(n => n.click())
        .then(() => sleep(100))
        .then(() => app.client.$("#ambient_light"))
        .then(n => n.addValue(25))
        .then(() => app.client.$("#ambient_light"))
        .then(n => n.getValue())
        .should
        .eventually
        .contain("25");
  });

  it("Should set ambient light for sensor 2", function () {
    return sleep(100)
        .then(() => app.client.$("#initialvalsensor2"))
        .then(n => n.click())
        .then(() => sleep(100))
        .then(() => app.client.$("#ambient_light"))
        .then(n => n.addValue(25))
        .then(() => app.client.$("#ambient_light"))
        .then(n => n.getValue())
        .should
        .eventually
        .contain("25");
  });

  it("Should set noise for sensor 1", function () {
    return sleep(100)
        .then(() => app.client.$("#initialvalsensor1"))
        .then(n => n.click())
        .then(() => sleep(100))
        .then(() => app.client.$("#noise_level"))
        .then(n => n.addValue(4))
        .then(() => app.client.$("#noise_level"))
        .then(n => n.getValue())
        .should
        .eventually
        .contain("4");
  });

  it("Should set noise for sensor 2", function () {
    return sleep(100)
        .then(() => app.client.$("#initialvalsensor2"))
        .then(n => n.click())
        .then(() => sleep(100))
        .then(() => app.client.$("#noise_level"))
        .then(n => n.addValue(4))
        .then(() => app.client.$("#noise_level"))
        .then(n => n.getValue())
        .should
        .eventually
        .contain("4");
  });
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}