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

    if (this.currentTest.title === 'Open mm-3DRobot configuration and click on File button next to c' || this.currentTest.title == 'Defining the sensor positions') {

      await this.app.client.$('#node_ProjectBrowserItem_21').doubleClick();

      await this.app.client.waitUntilWindowLoaded();

      await this.app.client.waitForVisible('#Configuration');

      await this.app.client.$('mm-page').$('#Configuration').click();

      await this.app.client.waitForVisible('.btn.btn-default');

      await this.app.client.$('.btn.btn-default').click(); //until step 27 where Edit Button is clicked
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
        console.log(logs)
        expect(logs[25]).contain('tutorial_3/.project.json');
      })
  })

  // //Step 24, 25
  it('Create mm through the 3DRobot icon', function(){
    return this.app.client
    .waitForVisible('#node_ProjectBrowserItem_24')
    .waitForVisible('.w2ui-expand')
    .$('#node_ProjectBrowserItem_24').$('.w2ui-expand').click()

    .waitForVisible('#node_ProjectBrowserItem_26')
    .waitForVisible('.w2ui-expand')
    .$('#node_ProjectBrowserItem_26').$('.w2ui-expand').click()
    .$('#node_ProjectBrowserItem_30').rightClick()
    .$('#w2ui-overlay').click().pause(2000)
    .$('#Ok').click().pause(2000)
    .$('#node_ProjectBrowserItem_21').getText()
    .then(function(text){
      assert.equal(text, 'mm-3DRobot')
    })
  })

  //Step 25, 26, 27, 28, 29
  //Manually cancel or select the fmu file
  // TODO: Need to repeat this 
  it('Open mm-3DRobot configuration and click on File button next to c', function(){
    return this.app.client
    .waitForVisible('#fmu0')
    .waitForVisible('#file')
    .$('#fmu0').$('#file').click();
  })

  //Step 31
  // TODO: Need to repeat this 
  it('Defining the sensor positions', function(){
    return this.app.client
    .waitForVisible('#initialvalsensor1')
    .$('#initialvalsensor1').click()

    .waitForVisible('#lf_position_y')
    .$('#lf_position_y').setValue('0.065')

    .waitForVisible('#lf_position_x')
    .$('#lf_position_x').setValue('0.001').pause(2000)
    .$('#lf_position_x').getValue()
      .then(function (text) {
        assert.equal(text, '0.001')
      })
  })
})
