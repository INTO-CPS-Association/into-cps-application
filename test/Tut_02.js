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

        await require("./TestHelpers").unZipTestData(testDataZipPath, testDataPath);
        await app.electron.remote.app.loadProject(testDataPath + "/project/.project.json");

        return app;
    });

    after(function () {
        // return require("./TestHelpers").commonShutdownTasks(app);
        return require("./TestHelpers").commonShutdownTasks(app, testDataPath);
    });

    // This should be done before as soon as we solve the programmatic project load problem
    it('Should have tutorial 2 loaded', function () {
        return app.electron.remote.app.getActiveProject()
            .should
            .eventually
            .equal(testDataPath + "/project/.project.json");
    });

    it("Should have the correct name", function () {
        return app.electron.remote.app.getIProject()
            .then(n => {
                return n
                    .name
                    .should
                    .equal("INTO-CPS_Tutorial");
            });
    });

    // /* Tutorial 2 */
    it("Should be able to open MM", function () {
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

    it("Should be able to open the Configuration pane", function () {
        return app.client.$("#Configuration")
            .then(n => n.click())
            .then(() => {
                return app.client.$("mm-configuration")
                    .then(n => n.elementId
                        .should
                        .contain("-"));
            });
    });

    it("Should be able to click edit button", function () {
        return app.client.$('button.btn.btn-default')
            .then(n => n.click())
            .then(() => {
                return app.client.$('button.btn.btn-default')
                    .then(n => n.getText())
                    .should
                    .eventually
                    .contain("Save");
            });
    });

    it("Should be able to add a new FMU", function () {
        return app.client.$("#fmu4")
            .then(n => n.elementId)
            .then(n => expect(n).to.equal(undefined))
            .then(() => {
                return app.client.$('button.btn.btn-default.btn-xs') // the + button in the config section
                    .then(n => n.click())
                    .then(() => {
                        return app.client.$("#fmu4")
                            .then(n => n.elementId)
                            .then(n => expect(n).to.contain("-"))
                    });
            });
    });

    it('Add a new FMU entry from Configuration', function () {
        return app.client.$("#fmu4 #fmu")
            .then(n => n.getValue())
            .should
            .eventually
            .equal("FMU");
    });

    it('Rename the new entry to controller', function () {
        return app.client.$("#fmu4 #fmu")
            .then(n => n.setValue("controller"))
            .then(() => {
                return app.client.$("#fmu4 #fmu")
                    .then(n => n.getValue())
                    .should
                    .eventually
                    .equal("controller");
            })
    });

    it('Should be able to add Controller.fmu to path', function () {
        return app.client.$("#fmu4 file-browser input")
            .then(n => n.setValue("LFRController.fmu"));
    });

    it("FMU instances contains controller", function () {
        return app.client.$("#controller")
            .then(n => n.elementId)
            .then(n => expect(n).to.contain("-"))
    });

    it('Add an instance of controller', async function () {
        await app.client.$("#controller")
            .then(n => n.click());

        return app.client.$("#fmu_instance")
            .then(n => n.click())
            .then(() => {
                return app.client.$("#instance_fmu")
                    .then(n => n.getValue())
                    .should
                    .eventually
                    .equal("controllerInstance");
            });
    });

    it("Can connect controller to left Servo", function () {
        return app.client.$("#outputinstancecontrollerInstance")
            .then(n => n.click())
            .then(() => {
                return app.client.$("#variableservoLeftVal")
                    .then(n => n.click())
                    .then(() => {
                        return app.client.$("#inputinstanceb")
                            .then(n => n.click())
                            .then(() => {
                                return app.client.$("#inputvariableservo_left_input")
                                    .then(n => n.click())
                                    .then(() => {
                                        return app.client.$("#inputvariableservo_left_input")
                                            .then(n => n.isSelected())
                                            .should
                                            .eventually
                                            .equal(true);
                                    });
                            });
                    });
            });
    });

    it("Can connect controller to right Servo", function () {
        return app.client.$("#outputinstancecontrollerInstance")
            .then(n => n.click())
            .then(() => {
                return app.client.$("#variableservoRightVal")
                    .then(n => n.click())
                    .then(() => {
                        return app.client.$("#inputinstanceb")
                            .then(n => n.click())
                            .then(() => {
                                return app.client.$("#inputvariableservo_right_input")
                                    .then(n => n.click())
                                    .then(() => {
                                        return app.client.$("#inputvariableservo_right_input")
                                            .then(n => n.isSelected())
                                            .should
                                            .eventually
                                            .equal(true);
                                    });
                            });
                    });
            });
    });

    it("Can connect Sensor1 to controller", function () {
        return app.client.$("#outputinstancesensor1")
            .then(n => n.click())
            .then(() => {
                return app.client.$("#variablelf_1_sensor_reading")
                    .then(n => n.click())
                    .then(() => {
                        return app.client.$("#inputinstancecontrollerInstance")
                            .then(n => n.click())
                            .then(() => {
                                return app.client.$("#inputvariablelfLeftVal")
                                    .then(n => n.click())
                                    .then(() => {
                                        return app.client.$("#inputvariablelfLeftVal")
                                            .then(n => n.isSelected())
                                            .should
                                            .eventually
                                            .equal(true);
                                    });
                            });
                    });
            });
    });

    it("Can connect Sensor2 to controller", function () {
        return app.client.$("#outputinstancesensor2")
            .then(n => n.click())
            .then(() => {
                return app.client.$("#variablelf_1_sensor_reading")
                    .then(n => n.click())
                    .then(() => {
                        return app.client.$("#inputinstancecontrollerInstance")
                            .then(n => n.click())
                            .then(() => {
                                return app.client.$("#inputvariablelfRightVal")
                                    .then(n => n.click())
                                    .then(() => {
                                        return app.client.$("#inputvariablelfRightVal")
                                            .then(n => n.isSelected())
                                            .should
                                            .eventually
                                            .equal(true);
                                    });
                            });
                    });
            });
    });

    it("Can add and set controller backwardRotate parameter", function () {
        return app.client.$("#initialvalcontrollerInstance")
            .then(n => n.click())
            .then(() => app.client.$("#addParameters"))
            .then(n => n.click())
            .then(() => app.client.$("#backwardRotate"))
            .then(n => n.setValue("0.1"))
            .then(() => app.client.$("#backwardRotate"))
            .then(n => n.getValue())
            .should
            .eventually
            .equal("0.1");
    });

    it("Can add and set controller forwardRotate parameter", function () {
        return app.client.$("#initialvalcontrollerInstance")
            .then(n => n.click())
            .then(() => app.client.$("#addParameters"))
            .then(n => n.click())
            .then(() => app.client.$("#forwardRotate"))
            .then(n => n.setValue("0.5"))
            .then(() => app.client.$("#forwardRotate"))
            .then(n => n.getValue())
            .should
            .eventually
            .equal("0.5");
    });

    it("Can add and set controller forwardSpeed parameter", function () {
        return app.client.$("#initialvalcontrollerInstance")
            .then(n => n.click())
            .then(() => app.client.$("#addParameters"))
            .then(n => n.click())
            .then(() => app.client.$("#forwardSpeed"))
            .then(n => n.setValue("0.4"))
            .then(() => app.client.$("#forwardSpeed"))
            .then(n => n.getValue())
            .should
            .eventually
            .equal("0.4");
    });

    it("Can save model setup", function() {
        return app.client.$('button.btn.btn-default')
            .then(n => n.click())
            .then(() => {
                return app.client.$('button.btn.btn-default')
                    .then(n => n.getText())
                    .should
                    .eventually
                    .contain("Edit");
            });
    });

    it("Saved model setup is correct", function() {
        const fs = require("fs");
        const testData = JSON.parse(fs.readFileSync(testDataPath + "/project/Multi-models/mm-3DRobot/mm.json", "utf-8"));
        const expectedData = JSON.parse(fs.readFileSync(testDataPath + "/testdata/mm.json", "utf-8"));
        return testData
            .should
            .deep
            .equal(expectedData);
    });

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