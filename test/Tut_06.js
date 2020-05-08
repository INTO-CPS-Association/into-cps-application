const Application = require('spectron').Application
const assert = require('assert')
const expect = require('chai').expect;
const electronPath = require('electron') // Require Electron from the binaries included in node_modules.
const path = require('path')
const fakeMenu = require('spectron-fake-menu')


describe.skip('In Tutorial 6', function () {
    this.timeout(120000)



    beforeEach(async function () {

        this.app = new Application({
            path: electronPath,
            env: { RUNNING_IN_SPECTRON: '1' },
            args: [path.join(__dirname, '..')]
        })

        await fakeMenu.apply(this.app);

        await this.app.start();
        await this.app.client.waitUntilWindowLoaded();

        return this.app;

    })

    afterEach(function () {

        if (this.app && this.app.isRunning()) {

            return this.app.stop()
                .then(() => {
                    if (this.currentTest.state === 'failed' && this.currentTest.title === 'Should have tutorial 6 loaded')
                        throw Error("Tutorial 6 project is not loaded!")
                })
        }
    })

    //To open a project, select File > Open Project
    it('File->Open Project Menu Click', function () {
        fakeMenu.clickMenu('File', 'Open Project');
        return this.app;
    })

    // This should be done before as soon as we solve the programmatic project load problem
    it('Should have tutorial 6 loaded', function () {
        return this.app.client.waitUntilWindowLoaded()
            .then(function () {
                return this.electron.remote.app.getActiveProject().then(r => { expect(r).contain('Tutorial_6'); })

            })
    })
    //Step 46
    it('Right click on the configuration file and create DSE configuration', function () {
        return this.app.client
            .waitForVisible('#node_ProjectBrowserItem_85')
            .waitForVisible('.w2ui-expand')
            .$('#node_ProjectBrowserItem_85').$('.w2ui-expand').click()

            .waitForVisible('#node_ProjectBrowserItem_87')
            .waitForVisible('.w2ui-expand')
            .$('#node_ProjectBrowserItem_87').$('.w2ui-expand').click()

            .waitForVisible('#node_ProjectBrowserItem_110')
            .$('#node_ProjectBrowserItem_110').rightClick()

            .waitForVisible('#td0')
            .$('#td0').click()
            .waitForVisible('#activeTabTitle')
            .$('#activeTabTitle').getText()
            .then(function (title) {
                expect(title).contain('DSE')
            })
    })

})