const Application = require('spectron').Application
const assert = require('assert')
const expect = require('chai').expect;
const electronPath = require('electron') // Require Electron from the binaries included in node_modules.
const path = require('path')
const fakeMenu = require('spectron-fake-menu')
//const ServerMock = require('mock-http-server')

describe.skip('Generic tests', function () {
  this.timeout(100000)


  //const server = new ServerMock({ host: "localhost", port: 12345 });

  beforeEach(function () {
    this.app = new Application({
      path: electronPath,
      args: [path.join(__dirname, '..')]
    })

    //fakeMenu.apply(this.app);

    //server.start(done);

    return this.app.start()
  })

  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop()
    }

    //server.stop(done);
  })

  it('shows an initial window', function () {
    return this.app.client.getWindowCount().then(function (count) {
      assert.equal(count, 1)
      // Please note that getWindowCount() will return 2 if `dev tools` are opened.
      // assert.equal(count, 2)
    })
  })

  it('initial window title is INTO-CPS App', function () {
    return this.app.client.getTitle().then(function (title) {
      assert.equal(title, 'INTO-CPS App')
    })
  })

  it('displays Welcome in mainView', function () {
    return this.app.client
      .waitUntilWindowLoaded()
      .waitForVisible('#mainView')
      .getText('#mainView').then(function (title) {
        expect(title).contain('Welcome to the INTO-CPS Application version ' + process.env.npm_package_version)
      })
  })
})




