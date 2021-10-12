const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
// needed so we can use as promised
chai.should();
chai.use(chaiAsPromised);

const app = require("./TestHelpers").app();
const path = require("path");
const testDataZipPath = path.resolve("test/TestData/test6_data.zip");
const testDataPath = path.resolve("test/TestData/test6_data");


describe('In Tutorial 6', function () {
	this.timeout(120000)

	before(async function () {
		await app.start();
		await app.client.waitUntilWindowLoaded();
		require("./TestHelpers").unZipTestData(testDataZipPath, testDataPath);
		await app.electron.remote.app.loadProject(testDataPath + "/project/.project.json");

		return app;
	});

	after(function () {
		return require("./TestHelpers").commonShutdownTasks(app, testDataPath);
	});

	// This should be done before as soon as we solve the programmatic project load problem
	it('Should have tutorial 6 loaded', function () {
		return app.electron.remote.app.getActiveProject()
			.should
			.eventually
			.equal(testDataPath + "/project/.project.json");
	})

	it("Should have the correct name", function () {
		return app.electron.remote.app.getIProject()
			.then(n => n.name)
			.should
			.eventually
			.equal("")
	});

	//Step 46
	it('Right click on the configuration file and create DSE configuration', function () {
		return app.client.$("#node_ProjectBrowserItem_8 .w2ui-expand")
			.then(n => n.click())
			.then(() => app.client.$("#node_ProjectBrowserItem_9 .w2ui-expand"))
			.then(n => n.click())
			.then(() => app.client.$("#node_ProjectBrowserItem_12"))
			.then(n => n.doubleClick(3000)) // prevents right clicking on the wrong thing
			.then(() => app.client.$("#node_ProjectBrowserItem_12"))
			.then(n => n.click({button: "right"}))
			.then(() => app.client.$("#w2ui-overlay tbody"))
			.then(n => n.$$("tr"))
			.then(n => n[0].click())
			.then(() => app.client.$("#activeTabTitle"))
			.then(n => n.getText())
			.should
			.eventually
			.match(/dse-DSE_Example/);
	});
});