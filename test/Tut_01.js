const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
// needed so we can use as promised
chai.should();
chai.use(chaiAsPromised);

const assert = require('assert')
const app = require("./TestHelpers").app();


describe('In Tutorial 1', function () {

  before(async function () {
    this.timeout(20000);

    await app.start();
    await app.client.waitUntilWindowLoaded();

    return app;

  })

  after(function () {
    if (app && app.isRunning())
      return app.stop()
  })

  //Step 2. To open a project, select File > Open Project
  xit('File->Open Project Menu Click', async function () {
    // fakeMenu.clickMenu('File', 'Open Project');
    //   this.intoCpsApp = await app.electron.remote.getGlobal("intCpsApp");
      // console.log(this.intoCpsApp)
  })

  // This should be done before as soon as we solve the programmatic project load problem
  xit('Should have tutorial 1 loaded', function () {
    return this.app.client.waitUntilWindowLoaded()
      .then(function () {
        return this.electron.remote.app.getActiveProject().then(
            function(r)
            {
              expect(r).is.not.null.and.equal('tutorial_1');
            })

      })
  })

  //Step 5. Click the + symbol next to Non-3D multimodel to expand it
  //Step 6. Double click to open Experiment1.
  xit('Go to Non-3D > Experiment1 from sidebar', function () {

    this.app.client.$('#activeTabTitle').waitForVisible().then(() => {

      return this.app.client.getText('#activeTabTitle')
        .then(function (title) {
          assert.equal(title, 'Non-3D > Experiment1')
        });
    })

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
