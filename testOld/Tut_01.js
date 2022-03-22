const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiWaitFor = require('chai-wait-for');
// needed so we can use as promised
chai.should();
chai.use(chaiAsPromised);
chai.use(chaiWaitFor);

const waitFor = chaiWaitFor.bindWaitFor({
    timeout: 20000,
    retryInterval: 100
});

const app = require("./TestHelpers").app();
const path = require("path");
const testDataZipPath = path.resolve("test/TestData/test1_data.zip");
const testDataPath = path.resolve("test/TestData/test1_data");

const sleep = require("./TestHelpers").sleep;

describe('In Tutorial 1', function () {
    this.timeout(120000)

    before(async function () {

        await app.start();
        await app.client.waitUntilWindowLoaded();
        require("./TestHelpers").unZipTestData(testDataZipPath, testDataPath);
        await app.electron.remote.app.loadProject(testDataPath + "/.project.json");

        await require("./TestHelpers").downloadCOE(app);

        return app;
    });

    after(function () {
        require("./TestHelpers").deleteCOE(app);
        return require("./TestHelpers").commonShutdownTasks(app, testDataPath);
    });

    // This should be done before as soon as we solve the programmatic project load problem
    it('Should have tutorial 1 loaded', function () {
        return app.electron.remote.app.getActiveProject()
            .should
            .eventually
            .equal(testDataPath + "/.project.json");
    })

    it("Should have name Three Tank", function () {
        return app.electron.remote.app.getIProject()
            .then(n => n.name)
            .should
            .eventually
            .equal("Three Tank")
    });

    it("Open Multi-Model from sidebar", function () {
        // multi model button
        return app.client.$("#node_ProjectBrowserItem_11")
            .then(n => n.doubleClick())
            .then(() => app.client.$("#activeTabTitle"))
            .then(n => n.getText())
            .should
            .eventually
            .equal("Non-3D");
    });

    //Step 5. Click the + symbol next to Non-3D multimodel to expand it
    it("Click on +", function () {
        // "#node_ProjectBrowserItem_27" is "Non-3D" multi-model
        // .w2ui-node-dots is the class on the "+" button
        return app.client.$("#node_ProjectBrowserItem_11 .w2ui-node-dots")
            // .then(() => app.client.$(".w2ui-node-dots"))
            .then(n => n.click())
            .then(() => app.client.$("#node_ProjectBrowserItem_11_sub")) // #node_ProjectBrowserItem_27_sub is the "Experiment1
            .then(n => n.getAttribute("style"))
            .should
            .eventually
            .not
            .contain("display: hidden;");
    });

    //Step 6. Double click to open Experiment1.
    it('Go to Non-3D > Experiment1 from sidebar', function () {
        // #node_ProjectBrowserItem_27_sub is "Experiment1" in the sidebar
        return app.client.$("#node_ProjectBrowserItem_11_sub")
            .then(n => n.doubleClick())
            .then(() => app.client.$("#activeTabTitle"))
            .then(n => n.getText())
            .should
            .eventually
            .equal("Non-3D > Experiment1");
    });

    it('Co-Simulation Engine offline', function () {
        return app.client.$("#Simulation")
            .then(n => n.click())
            .then(() => app.client.$("coe-launch > div.alert"))
            .then(n => n.getText())
            .should
            .eventually
            .contain("Co-Simulation Engine offline");
    });

    it("Launch button says Launch", function () {
        return app.client.$("coe-simulation")
            .then(() => app.client.$(".btn.btn-sm.btn-default"))
            .then(n => n.getText())
            .should
            .eventually
            .equal("Launch");
    })

    it("Simulate button is disabled", function () {
        return app.client.$("coe-simulation")
            .then(() => app.client.$("div>div>.btn.btn-default"))
            .then(n => n.isEnabled())
            .should
            .eventually
            .be
            .false;
    })

    //Step 7. Click Launch
    it('Co-Simulation Engine online', function () {
        return app.client.$("coe-simulation")
            .then(() => app.client.$(".btn.btn-sm.btn-default"))
            .then(n => n.click())
            .then(() => sleep(300))
            .then(() => app.client.$("coe-launch"))
            .then(n => n.$(".alert.alert-success"))
            // .then(async () => {
            //     return await waitFor(() => app.client.$("div.alert.alert-success").getText())
            //         .to
            //         .match(/Co-Simulation Engine, .+, online at .+\./);
            //     });
            .then(async n => {
                return waitFor(await n.getText())
                    .to
                    .match(/maestroV.+, online at .+\./);
                });
            
    });

    it("Simulate button is enabled", function () {
        return app.client.$("coe-simulation")
            .then(() => app.client.$("div>div>.btn.btn-default"))
            .then(n => n.isEnabled())
            .should
            .eventually
            .be
            .true;
    });

    it('Simulate button shows simulate', function () {
        return app.client.$("coe-simulation")
            .then(n => n.$("div>div>.btn.btn-default"))
            .then(n => n.getText())
            .should
            .eventually
            .equal("Simulate");
    });

    //Step 8. Click simulate to run a co-simulation
    it('Simulate shows Stop after clicking', function () {
        return app.client.$("coe-simulation")
            .then(n => n.$("div>div>.btn.btn-default"))
            .then(n => n.click())
            .then(() => app.client.$("coe-simulation"))
            .then(n => n.$("div>div>.btn.btn-default"))
            .then(n => n.getText())
            .should
            .eventually
            .equal("Stop");
    });

    //Step 10. Expand the configuration
    it('Click Edit button to change the Co-Simulation parameters', function () {
        return app.client.$("#Configuration") // open the config panel
            .then(n => n.click())
            .then(() => app.client.$(".btn.btn-default")) // click on the edit button
            .then(n => n.click())
            .then(() => app.client.$(".btn.btn-default")) /// check the button now says save
            .then(n => n.getText())
            .should
            .eventually
            .equal("Save");
    });

    //Step 11. Click Edit Button, set Start time
    it('Change Start Time Co-Simulation parameter', function () {
        // find the start time form input
        let startInput = app.client.$(".form-control.ng-untouched.ng-pristine.ng-valid");
        return startInput
            .then(n => n.setValue("7"))
            .then(() => app.client.$(".form-control.ng-touched.ng-dirty.ng-valid"))
            .then(async n => {
                return waitFor(await n.getValue())
                    .to
                    // .eventually
                    .equal("7");
              });
    });
});