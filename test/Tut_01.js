const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
// needed so we can use as promised
chai.should();
chai.use(chaiAsPromised);

const assert = require('assert')
const app = require("./TestHelpers").app();
const path = require("path");
const projectPath = path.resolve("test/TestData/tutorial_1/.project.json");


describe('In Tutorial 1', function () {
    this.timeout(120000)

    before(async function () {

        await app.start();
        await app.client.waitUntilWindowLoaded();

        await app.electron.remote.app.loadProject(projectPath);

        return app;
    })

    after(function () {
        if (app && app.isRunning())
            return app.stop()
    })

    // This should be done before as soon as we solve the programmatic project load problem
    it('Should have tutorial 1 loaded', function () {
        return app.electron.remote.app.getActiveProject().should.eventually.equal(projectPath);
    })

    it("Should have name Three Tank", async function () {
        return (await app.electron.remote.app.getIProject()).name.should.equal("Three Tank");
    })

    it("Open Multi-Model from sidebar", async function () {
        let a = await app.client.$("#node_ProjectBrowserItem_27");
        await a.doubleClick();

        return (await app.client.$("#activeTabTitle"))
            .getText()
            .should
            .eventually
            .equal("Non-3D")
    })

    //Step 5. Click the + symbol next to Non-3D multimodel to expand it
    it("Click on +", async function () {
        // "#node_ProjectBrowserItem_27" is "Non-3D" mutli model
        // .w2ui-node-dots is the class on the "+" button
        await app.client.$("#node_ProjectBrowserItem_27")
            .then(n => n.$(".w2ui-node-dots"))
            .then(n => n.click());

        // #node_ProjectBrowserItem_27_sub is the "Experiment1
        return app.client.$("#node_ProjectBrowserItem_27_sub")
            .then(n => n.getAttribute(("style")))
            .should
            .eventually
            .not
            .contain("display: hidden;");
    })

    //Step 6. Double click to open Experiment1.
    it('Go to Non-3D > Experiment1 from sidebar', async function () {

        await app.client.$("#node_ProjectBrowserItem_27_sub")
            .then(n => n.doubleClick())

        return app.client.$("#activeTabTitle")
            .then(n => n.getText())
            .should.eventually.equal("Non-3D > Experiment1");
    })

    xit('Co-Simulation Engine offline', function () {

        this.app.client.$('coe-simulation').waitForVisible()
            .then(() => {

                return this.app.client.$('coe-simulation')
                    .$('.alert.alert-danger')
                    .getText()
                    .then(function (text) {
                        expect(text).contain('Co-Simulation Engine offline')
                    })
            })
    })


    //Step 7. Click Launch
    xit('Co-Simulation Engine online', function () {

        this.app.client.$('coe-simulation').waitForVisible().then(() => {

            return this.app.client
                .$('coe-simulation').$('.btn.btn-sm.btn-default').click().pause(3000)
                .$('.alert.alert-success').getText()
                .then(function (text) {
                    expect(text).contain('online')
                })
        })
    })

    //Step 8. Click simulate to run a co-simulation
    xit('Button shows Stop after clicking Simulate button', function () {

        this.app.client.$('coe-simulation').waitForVisible().then(() => {

            return this.app.client
                .$('coe-simulation').$('.btn.btn-sm.btn-default').click().pause(3000)
                .$('.btn.btn-default').click()
                .$('.btn.btn-default').getText()
                .then(function (text) {
                    expect(text).contain('Stop')
                })
        })
    })

    xit('Click on COE Console', function () {

        this.app.client.$('#coe-status-btn-status').waitForExist()
            .then(() => {

                this.app.client.$('#coe-status-btn-status').doubleClick()
                    .$('.navbar-brand').waitForExist().then(() => {
                    return NavBar.$('.navbar-brand').getText()
                        .then(function (text) {
                            expect(text).contain('COE Status')
                        })
                });
            });
    })

    //Step 10. Expand the configuration
    xit('Click Edit button to change the Co-Simulation parameters', function () {

        this.app.client.$('coe-page').waitForVisible()
            .then(() => {

                return this.app.client
                    .$('coe-page').$('.panel-heading').click()
                    .$('.btn.btn-default').click()
                    .$('.btn.btn-default').getText()
                    .then(function (text) {
                        expect(text).contain('Save')
                    })
            })
    })

    //Step 11. Click Edit Button, set Start time
    xit('Change Start Time Co-Simulation parameter', function () {

        this.app.client.$('coe-page').waitForVisible()
            .then(() => {

                return this.app.client
                    .$('coe-page').$('.panel-heading').click()
                    .$('.btn.btn-default').click().pause(3000)
                    .$('.form-control.ng-untouched.ng-pristine.ng-valid').setValue('0')
                    .$('.form-control.ng-untouched.ng-pristine.ng-valid').getValue()
                    .then(function (text) {
                        expect(text).contain('0')
                    })
            })
    })
})