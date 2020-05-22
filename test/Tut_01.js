const Application = require('spectron').Application
const assert = require('assert')
const expect = require('chai').expect;
const electronPath = require('electron') // Require Electron from the binaries included in node_modules.
const path = require('path')
const fakeMenu = require('spectron-fake-menu')


describe.skip('In Tutorial 1', function () {
  this.timeout(120000)



  beforeEach(async function () {

    this.app = new Application({
      path: electronPath,
      env: { RUNNING_IN_SPECTRON: '1' },
      args: [path.join(__dirname, '..')]
    })

    fakeMenu.apply(this.app);

    await this.app.start();
    await this.app.client.waitUntilWindowLoaded();

    if (!(this.currentTest.title === 'File->Open Project Menu Click')) {
      await this.app.client.waitForVisible('#node_ProjectBrowserItem_28', 20000);

      await this.app.client.$('#node_ProjectBrowserItem_28').$('.w2ui-expand').click();

      await this.app.client.waitForVisible('#node_ProjectBrowserItem_29');

      await this.app.client.doubleClick('#node_ProjectBrowserItem_29');

      await this.app.client.waitUntilWindowLoaded();
    }


    return this.app;

  })

  afterEach(function () {

    if (this.app && this.app.isRunning()) {

      return this.app.stop()
        .then(() => {
          if (this.currentTest.state === 'failed' && this.currentTest.title === 'Should have tutorial 1 loaded')
            throw Error("Tutorial 1 project is not loaded!")
        })
    }
  })

  //Step 2. To open a project, select File > Open Project
  it('File->Open Project Menu Click', function () {
    fakeMenu.clickMenu('File', 'Open Project');
    return this.app;
  })

  // This should be done before as soon as we solve the programmatic project load problem
  it('Should have tutorial 1 loaded', function () {
    return this.app.client.waitUntilWindowLoaded()
      .then(function () {
        return this.electron.remote.app.getActiveProject().then(r => { expect(r).contain('tutorial_1'); })

      })
  })

  //Step 5. Click the + symbol next to Non-3D multimodel to expand it
  //Step 6. Double click to open Experiment1.
  it('Go to Non-3D > Experiment1 from sidebar', function () {

    this.app.client.$('#activeTabTitle').waitForVisible().then(() => {

      return this.app.client.getText('#activeTabTitle')
        .then(function (title) {
          assert.equal(title, 'Non-3D > Experiment1')
        });
    })

  })

  it('Co-Simulation Engine offline', function () {

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
  it('Co-Simulation Engine online', function () {

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
  it('Button shows Stop after clicking Simulate button', function () {

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

  it('Click on COE Console', function () {

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
  it('Click Edit button to change the Co-Simulation parameters', function () {

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
  it('Change Start Time Co-Simulation parameter', function () {

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
