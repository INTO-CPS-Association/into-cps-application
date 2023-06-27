import { _electron as electron, ElectronApplication, Page } from "playwright";
import axios from "axios";
import { IDownloadFile, IGithubApiDir } from "./ApiModels"
import { downloadFile } from "./IO";
import * as fs from "fs";
const AdmZip = require("adm-zip");
import * as Crypto from "crypto";



// Which COE to test on? coe|maestro2 Default: coe
// https://github.com/INTO-CPS-Association/INTO-CPS-Association.github.io/blob/master/download/1.0.9.json


export class TestHelper {
    public electronApp: ElectronApplication;
    public window: Page;
    public testDataPath: string;
    private TestEngine: string = "coe";
    private coeDownloaded: boolean = false;

    /*
    *   Start function to use the testing framework Playwright
    *   As optional a test data zip file can be provided with data using relative path from test/TestData
    * 
    */
    public async launch(testDataZipFile?: string): Promise<void> {
        // Start
        process.env.RUNNING_TEST = 'whatever, we only evaluate on the key..';
        await electron.launch(
            {
                args: ['.']
            }
        ).then((eA) => {
            this.electronApp = eA;
        });
        this.window = await this.electronApp.firstWindow();


        // Unzip and load project if file provided
        if (testDataZipFile) {
        
            const zipPath = __dirname + "/../TestData/" + testDataZipFile;
            var zip = new AdmZip(zipPath);
            this.testDataPath = __dirname + "/../TestData/" + testDataZipFile.split('.')[0]
            //console.log(this.testDataPath)
            zip.extractAllTo(this.testDataPath, true);
            await this.electronApp.evaluate(async (eApp: any, path: string) => {
                eApp.app.loadProject(path + "/project/.project.json"); // See main for function
            }, this.testDataPath); //.then( () => console.log("Loaded electron app, with testdata from: " + zipPath));
        }

        await this.downloadCOE();
    }

    public async shutdown(): Promise<void> {
        if (this.electronApp) {
            // Shutdown COE
            await this.electronApp.evaluate( (eApp: any) => {
                eApp.app.stopCoe();
            });

            // // Remove COE
            // await this.electronApp.evaluate( (eApp : any) => {
            //     return eApp.app.getCOEDownloadPath();
            // }).then( (p) => fs.unlinkSync( p + "/coe.jar") );

            // Remove test data
            await this.electronApp.close().then(() => {
                if (this.testDataPath) {
                    fs.rmdirSync(this.testDataPath, { recursive: true });
                }
            });
        }
        return;
    }

    private async downloadCOE(): Promise<void> {

        // Get git directory for newest software
        let downloadListUrl = "https://api.github.com/repos/INTO-CPS-Association/INTO-CPS-Association.github.io/contents/download";
        let engineDownloadIndex: any;
        const response: any = await axios.get(downloadListUrl, { headers: { 'Accept': 'application/vnd.github.v3.raw' } })
            .catch((err) => {
                console.error("Error while getting software versions list " + err);
            });
        const versionsList: Array<IGithubApiDir> = response.data;
        var filteredList = new Array<IGithubApiDir>();
        //Filter for correct naming
        versionsList.forEach((item: IGithubApiDir) => {
            let nameSplitted: string[] = item.name.split('.');
            if (nameSplitted.length === 4 && nameSplitted.lastIndexOf('json') != -1 && Number.isInteger(parseInt(nameSplitted[0]))) {
                filteredList.push(item);
            }
        });
        // Get newest version of coes..
        let newestDownloadVersion = filteredList.sort().reverse()[0];

        const versionResponse: any = await axios.get(newestDownloadVersion.download_url)
            .catch((err) => {
                console.log("Got an error while trying to download version file: " + newestDownloadVersion.name);
                console.error(err);
            });
        const downloadList: IDownloadFile = versionResponse.data;

        // Define engine

        if (this.TestEngine === "maestro2") {
            engineDownloadIndex = downloadList.tools.maestro2;
        } else {
            engineDownloadIndex = downloadList.tools.coe;
        }


        // Install directory
        const coeDir: string = await this.electronApp.evaluate( (eApp: any) => {
            return eApp.app.getCOEDownloadPath(); //From main.js
        });
        if (!fs.existsSync(coeDir + "/")) fs.mkdirSync(coeDir + "/", { recursive: true });


        // Check if already downloaded, else do it..
        let coePath = coeDir + "/coe.jar";
        if (fs.existsSync(coePath)) {
            this.coeDownloaded = true;
            return;
        }
        await downloadFile(engineDownloadIndex.platforms.any.url, coePath).then(() => {
            console.log("Downloaded " + engineDownloadIndex.name + " version " + engineDownloadIndex.version);
        })
    }

    public ReadJsonFile( file : string) : string
    {
        return JSON.parse(fs.readFileSync(file,"utf-8"));
    }
}