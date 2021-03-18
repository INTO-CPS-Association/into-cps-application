const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
// needed so we can use as promised
chai.should();
chai.use(chaiAsPromised);

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
        return require("./TestHelpers").commonShutdownTasks(app, testDataPath);
    });

    it('Should have tutorial 2 loaded', function () {
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

    // /* Tutorial 2 */
    it("Should be able to open MM", function () {
        return app.client.$('#node_ProjectBrowserItem_21')
            .then(n => n.doubleClick())
            .then(() => app.client.$("#activeTabTitle"))
            .then(n => n.getText())
            .should
            .eventually
            .equal("mm-3DRobot");
    });

    it("Should be able to open the Configuration pane", function () {
        return app.client.$("#Configuration")
            .then(n => n.click())
            .then(() => app.client.$("mm-configuration"))
            .should
            .eventually
            .have
            .property("elementId");
    });

    it("Should be able to click edit button", function () {
        return app.client.$('button.btn.btn-default')
            .then(n => n.click())
            .then(() => app.client.$('button.btn.btn-default'))
            .then(n => n.getText())
            .should
            .eventually
            .contain("Save");
    });

    it("Should be able to add a new FMU", function () {
        return app.client.$("#fmu4")
            .then(n => n.elementId)
            .then(n => expect(n).to.equal(undefined))
            .then(() => app.client.$('button.btn.btn-default.btn-xs')) // the + button in the config section
            .then(n => n.click())
            .then(() => app.client.$("#fmu4"))
            .should
            .eventually
            .have
            .property("elementId");
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
            .then(() => app.client.$("#fmu4 #fmu"))
            .then(n => n.getValue())
            .should
            .eventually
            .equal("controller");
    });

    it('Should be able to add Controller.fmu to path', function () {
        return app.client.$("#fmu4 file-browser input")
            .then(n => n.setValue("LFRController.fmu"));
    });

    it("FMU instances contains controller", function () {
        return app.client.$("#controller")
            .should
            .eventually
            .have
            .property("elementId"); // $ does not return this property if the element is not found
    });

    it('Add an instance of controller', async function () {
        await app.client.$("#controller")
            .then(n => n.click());

        return app.client.$("#fmu_instance")
            .then(n => n.click())
            .then(() => app.client.$("#instance_fmu"))
            .then(n => n.getValue())
            .should
            .eventually
            .equal("controllerInstance");
    });

    it("Can connect controller to left Servo", function () {
        return app.client.$("#outputinstancecontrollerInstance")
            .then(n => n.click())
            .then(() => app.client.$("#variableservoLeftVal"))
            .then(n => n.click())
            .then(() => app.client.$("#inputinstanceb"))
            .then(n => n.click())
            .then(() => app.client.$("#inputvariableservo_left_input"))
            .then(n => n.click())
            .then(() => app.client.$("#inputvariableservo_left_input"))
            .then(n => n.isSelected())
            .should
            .eventually
            .equal(true);
    });

    it("Can connect controller to right Servo", function () {
        return app.client.$("#outputinstancecontrollerInstance")
            .then(n => n.click())
            .then(() => app.client.$("#variableservoRightVal"))
            .then(n => n.click())
            .then(() => app.client.$("#inputinstanceb"))
            .then(n => n.click())
            .then(() => app.client.$("#inputvariableservo_right_input"))
            .then(n => n.click())
            .then(() => app.client.$("#inputvariableservo_right_input"))
            .then(n => n.isSelected())
            .should
            .eventually
            .equal(true);
    });

    it("Can connect Sensor1 to controller", function () {
        return app.client.$("#outputinstancesensor1")
            .then(n => n.click())
            .then(() => app.client.$("#variablelf_1_sensor_reading"))
            .then(n => n.click())
            .then(() => app.client.$("#inputinstancecontrollerInstance"))
            .then(n => n.click())
            .then(() => app.client.$("#inputvariablelfLeftVal"))
            .then(n => n.click())
            .then(() => app.client.$("#inputvariablelfLeftVal"))
            .then(n => n.isSelected())
            .should
            .eventually
            .equal(true);
    });

    it("Can connect Sensor2 to controller", function () {
        return app.client.$("#outputinstancesensor2")
            .then(n => n.click())
            .then(() => app.client.$("#variablelf_1_sensor_reading"))
            .then(n => n.click())
            .then(() => app.client.$("#inputinstancecontrollerInstance"))
            .then(n => n.click())
            .then(() => app.client.$("#inputvariablelfRightVal"))
            .then(n => n.click())
            .then(() => app.client.$("#inputvariablelfRightVal"))
            .then(n => n.isSelected())
            .should
            .eventually
            .equal(true);
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
            .then(() => app.client.$('button.btn.btn-default'))
            .then(n => n.getText())
            .should
            .eventually
            .contain("Edit");
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

    it('Right-click on the multi-model configuration should open popup', function () {
        return app.client.$('#node_ProjectBrowserItem_21')
            .then(n => n.click({button: "right"}))
            .then(() => app.client.$("#w2ui-overlay tbody"))
            .then(n => n.$$("tr"))
            .then(n => n[1].click())
            .then(() => app.client.$("#w2ui-popup div.w2ui-popup-title"))
            .then(async n => await n.waitForExist(3000))
            .then(() => app.client.$("#w2ui-popup div.w2ui-popup-title"))
            .then(n => n.getText())
            .should
            .eventually
            .contain("New Co-Simulation Configuration");
    });

    it("Should click Ok button to create new Co-Sim and then open new Co-Sim", function () {
        return app.client.$("#w2ui-popup #Ok")
            .then(n => n.click())
            .then(() => app.client.$("#activeTabTitle"))
            .then(n => n.getText())
            .should
            .eventually
            .equal("mm-3DRobot > co-sim");
    });

    it('Edit Step Size to 0.01 under Basic Configuration', function () {
        return app.client.$("#Configuration")
            .then(n => n.click())
            .then(() => app.client.$("coe-configuration button.btn.btn-default"))
            .then(n => n.click())
            .then(() => app.client.$("#stepsize"))
            .then(n => n.setValue("0.01"))
            .then(() => app.client.$("#stepsize"))
            .then(n => n.getValue())
            .should
            .eventually
            .equal("0.01");
    });

    it("Should add a new live plot", function() {
        return app.client.$$(".panel-heading h4>a")
            .then(n => n[3].click())
            .then(() => app.client.$("#live-collapse button"))
            .then(n => n.click())
            .then(() => app.client.$("#live-collapse .constraint-container div.panel-heading"))
            .then(n => n.getText())
            .should
            .eventually
            .equal("Graph Variables");
    });

    it("Enable sensor1 in live plotting", function() {
        return app.client.$("#sensor1lf_1_sensor_reading")
            .then(n => n.click())
            .then(() => app.client.$("#sensor1lf_1_sensor_reading"))
            .then(n => n.isSelected())
            .should
            .eventually
            .equal(true);
    });
});