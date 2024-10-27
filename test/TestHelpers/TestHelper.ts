import { _electron as electron, ElectronApplication, Page } from "playwright";
import * as path from "path";
import MCR from "monocart-coverage-reports";
import coverageOptions from "../../mcr.config";

export class TestHelper {
    public electronApp: ElectronApplication | null = null;
    public window: Page | null = null;

    public async launch(): Promise<void> {
        const distPath = path.resolve(__dirname, "../../dist");
        
        this.electronApp = await electron.launch({
            args: [path.join(distPath, "main.js")],
            cwd: distPath
        });

        this.window = await this.electronApp.firstWindow();
        const title = await this.window.title();
    }

    public async startCoverage(): Promise<void> {
        if (this.window) {
            await this.window.coverage.startJSCoverage({ resetOnNavigation: false });
            await this.window.coverage.startCSSCoverage({ resetOnNavigation: false });
        } else {
            console.log("No main window found for coverage setup");
        }
    }

    public async stopCoverage(): Promise<any[]> {
        if (this.window) {
            const jsCoverage = await this.window.coverage.stopJSCoverage();
            const cssCoverage = await this.window.coverage.stopCSSCoverage();
            return [...jsCoverage];
        }
        return [];
    }

    public async shutdown(): Promise<void> {
        if (this.electronApp) {
            await this.electronApp.close();
        }
    }

    public async getMenuItems(): Promise<any> {
        if (this.electronApp) {
            return await this.electronApp.evaluate(async ({ Menu }) => {
                const menu = Menu.getApplicationMenu();
                if (!menu) {
                    return [];
                }
                return menu.items.map(item => ({
                    label: item.label,
                    submenu: item.submenu ? item.submenu.items.map(subItem => subItem.label) : []
                }));
            });
        }
        return [];
    }

    public async addCoverageToReport(coverageList: any[]): Promise<void> {
        if (coverageList.length === 0) {
            console.log("No coverage data collected");
        } else {
            const mcr = MCR(coverageOptions);
            await mcr.add(coverageList);
        }
    }
}
