const path = require("path");
const Application = require("spectron").Application;
const electronPath = require('electron') // Require Electron from the binaries included in node_modules.
const fs = require("fs");

module.exports.app = function()
{
    const appPath = path.join(__dirname, "..");

    return new Application({
        path: electronPath,
        args: [appPath],
        env: {
            RUNNING_IN_SPECTRON: '1'
        },
        startTimeout: 20000
    })
}

let wasDownloaded = false;

module.exports.downloadCOE = async function(app) {
    const request = require("request");
    // const coeDownloadURL = "https://github.com/INTO-CPS-Association/maestro/releases/download/Release%2F1.0.10/webapi-1.0.10.jar";
    const coeDownloadURL = "https://github.com/INTO-CPS-Association/maestro/releases/download/Release%2F2.1.4/maestro-webapi-2.1.4.jar";

    let p = await app.electron.remote.app.getCOEDownloadPath()

    if(!fs.existsSync(p + "/"))
        fs.mkdirSync(p + "/");

    let coePath = p + "/coe.jar";

    if (fs.existsSync(coePath)) {
        wasDownloaded = true;
        return;
    }

    await request.get(coeDownloadURL)
        .on("error", error => console.log("Failed to download COE: " + error))
        .pipe(fs.createWriteStream(coePath))
        .on("finish", () =>
            console.log("finished download"));
}

module.exports.deleteCOE = function(app) {
    if(wasDownloaded)
    {
        wasDownloaded = false;
        return;
    }

    app.electron.remote.app.getCOEDownloadPath()
        .then(p => fs.unlinkSync(p + "/coe.jar"));
}

module.exports.commonShutdownTasks = async function(app, testDataPath){
    if(app && app.isRunning())
    {
        app.electron.remote.app.stopCoe();
        return app.stop()
            .finally(() => {
                if(testDataPath)
                    fs.rmdirSync(testDataPath, {recursive: true });
            });
    }
}

module.exports.downloadTestData = async function(dataUrl){
    const request = require("request");
    const admZip = require("adm-zip");
    const path = require("path");
    const dataPath = path.resolve("test/TestData/");
    const downloadPath = dataPath + "data.zip";

    console.log("Downloading test data from " + dataUrl);

    return new Promise((resolve, reject) => {
        request.get(dataUrl)
            .on("error", error => console.log("Failed to download test data: " + error))
            .pipe(fs.createWriteStream(downloadPath))
            .on("finish", () => {
                console.log("Unzipping test data");

                const zip = new admZip(downloadPath);
                const folderName = zip.getEntries()[0].entryName;

                zip.extractAllTo(dataPath, true);
                fs.unlinkSync(downloadPath);

                resolve(dataPath + "/" + folderName);
            });
    });
}

module.exports.unZipTestData = function (zipPath, extractPath) {
    const zip = new require("adm-zip")(zipPath);
    zip.extractAllTo(extractPath, true);
}