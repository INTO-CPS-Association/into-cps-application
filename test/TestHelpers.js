const path = require("path");
const Application = require("spectron").Application;
const electronPath = require('electron') // Require Electron from the binaries included in node_modules.

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



module.exports.downloadTestData = async function(dataUrl){
    const request = require("request");
    const fs = require("fs");
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