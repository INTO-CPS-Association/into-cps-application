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