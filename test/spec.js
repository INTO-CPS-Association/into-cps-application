const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
// needed so we can use as promised
chai.should();
chai.use(chaiAsPromised);

const appVersion = require('../package.json').version;
const app = require("./TestHelpers").app();

describe('Generic tests', function () {
  this.timeout(120000)

  before(async function () {
    return await app.start();
  })

  after(function () {
    if (app && app.isRunning())
      return app.stop();
  })

  it('Shows a window', function () {
    return app.client.waitUntilWindowLoaded().then(function () {
      app.client.getWindowCount().should.eventually.be.at.least(1);
    })
  })

  it('Shows a window with the correct title', function () {
    return app.client.getTitle().should.eventually.equal('INTO-CPS App')
  })

  // Maybe related to https://github.com/electron-userland/spectron/issues/815npm 
  it('Displays the expected message in the window', async function () {
    return (await app.client.$("#mainView"))
        .getText()
        .should
        .eventually
        .contain('Welcome to the INTO-CPS Application version ' + appVersion);
  })
})