const Application = require('spectron').Application
const assert = require('assert')
const expect = require('chai').expect;
const electronPath = require('electron') // Require Electron from the binaries included in node_modules.
const path = require('path')
const fakeMenu = require('spectron-fake-menu')


describe('In Tutorial 3', function () {
  this.timeout(120000)



  beforeEach(async function () {

    this.app = new Application({
      path: electronPath,
      args: [path.join(__dirname, '..')]
    })

    await fakeMenu.apply(this.app);

    await this.app.start();
    await this.app.client.waitUntilWindowLoaded();

    if (!(this.currentTest.title === 'File->Open Project Menu Click')) {


    }


    return this.app;

  })

  afterEach(function () {

    if (this.app && this.app.isRunning()) {

      return this.app.stop()
        .then(() => {
          if (this.currentTest.state === 'failed' && this.currentTest.title === 'Should have tutorial 3 loaded')
            throw Error("Tutorial 3 project is not loaded!")
        })
    }
  })

  //Step 2. To open a project, select File > Open Project
  it('File->Open Project Menu Click', function () {
    fakeMenu.clickMenu('File', 'Open Project');
    return this.app;
  })

  // This should be done before as soon as we solve the programmatic project load problem
  xit('Should have tutorial 3 loaded', function () {
    return this.app.client.waitUntilWindowLoaded()
      .getMainProcessLogs().then(function (logs) {
        // For test debugging processes uncomment the following line
        // console.log(logs)
        expect(logs[25]).contain('tutorial_7/.project.json');
      })
  })

 


})
