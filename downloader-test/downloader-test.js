/*
 * This file is part of the INTO-CPS toolchain.
 *
 * Copyright (c) 2017-CurrentYear, INTO-CPS Association,
 * c/o Professor Peter Gorm Larsen, Department of Engineering
 * Finlandsgade 22, 8200 Aarhus N.
 *
 * All rights reserved.
 *
 * THIS PROGRAM IS PROVIDED UNDER THE TERMS OF GPL VERSION 3 LICENSE OR
 * THIS INTO-CPS ASSOCIATION PUBLIC LICENSE VERSION 1.0.
 * ANY USE, REPRODUCTION OR DISTRIBUTION OF THIS PROGRAM CONSTITUTES
 * RECIPIENT'S ACCEPTANCE OF THE OSMC PUBLIC LICENSE OR THE GPL 
 * VERSION 3, ACCORDING TO RECIPIENTS CHOICE.
 *
 * The INTO-CPS toolchain  and the INTO-CPS Association Public License 
 * are obtained from the INTO-CPS Association, either from the above address,
 * from the URLs: http://www.into-cps.org, and in the INTO-CPS toolchain distribution.
 * GNU version 3 is obtained from: http://www.gnu.org/copyleft/gpl.html.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without
 * even the implied warranty of  MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE, EXCEPT AS EXPRESSLY SET FORTH IN THE
 * BY RECIPIENT SELECTED SUBSIDIARY LICENSE CONDITIONS OF
 * THE INTO-CPS ASSOCIATION.
 *
 * See the full INTO-CPS Association Public License conditions for more details.
 *
 * See the CONTRIBUTORS file for author and contributor information. 
 */


#!/usr/bin/env node

console = require("console");
downloader = require("../dist/downloader/Downloader");

const VERSIONS_URL = "http://overture.au.dk/into-cps/site/download/versions.json";
function progress(state) {
  console.log(parseInt(state.percentage * 100, 10) + "%");
}


function testDownloadAndUnpack() {
  var tool;
  console.log("Fetching list of available version")
  return downloader.fetchVersionList(VERSIONS_URL)
  .then(function (data) {
    console.log(JSON.stringify(data) + "\n");
    console.log("Fetching version 0.0.6");
    return downloader.fetchVersion(data["0.0.6"]);
  })
  .then(function(data) {
    console.log(JSON.stringify(data) + "\n");
    console.log("Downloading tool: Overture Tool Wrapper");
    tool = data.tools.overtureToolWrapper;
    return downloader.downloadTool(tool, ".", progress);
  }).then(function (filePath) {
    console.log("Download complete: " + filePath);
    console.log("Unpacking tool");
    return downloader.installTool(tool, filePath, "installed");
  })
  .then(function () {
    console.log("Installation complete\n");
    return;
  }, function (error) {
    console.log(error);
  });
}

function testInstallerLaunch() {
  var dummyTool = {
    platforms: {
      linux64: {
        action: "launch"
      }
    }
  };

  console.log("Running dummy tool installer");
  downloader.installTool(dummyTool, "./dummy_installer.sh", ".")
  .then(function (stdout) {
    console.log("Dummy tool installer stdout:");
    console.log(stdout + "\n");
    console.log("Dummy tool installation successful");
  }, function (error) {
    console.log(error);
  });
}

testDownloadAndUnpack()
.then(testInstallerLaunch);
