import { test, expect } from "@playwright/test";
import { TestHelper } from "./TestHelpers/TestHelper";

const helper = new TestHelper();

test.describe("Electron main.ts Tests", () => {
    test.beforeAll(async () => {
        await helper.launch();
        await helper.startCoverage();
    });

    test.afterAll(async () => {
        await helper.shutdown();
    });

    test('App should launch successfully with correct title', async () => {
        if (!helper.electronApp) {
            throw new Error("Electron app is not initialized");
        }

        const windowCount = helper.electronApp.windows().length;
        expect(windowCount).toBeGreaterThan(0);

        if (!helper.window) {
            throw new Error("Window is not initialized");
        }

        const title = await helper.window.title();
        expect(title).not.toBeNull();
        expect(title).toContain('INTO-CPS App');
    });

    test('App should quit when "Quit" menu item is clicked', async () => {
        if (!helper.electronApp) {
            throw new Error("Electron app is not initialized");
        }

        const coverageList = await helper.stopCoverage();
        await helper.addCoverageToReport(coverageList);

        await helper.electronApp.evaluate(({ Menu }) => {
            const menu = Menu.getApplicationMenu();
            if (!menu) {
                throw new Error("Menu is not initialized");
            }

            const fileMenu = menu.items.find(item => item.label === 'File');
            if (!fileMenu) {
                throw new Error("'File' menu is not found");
            }

            const quitMenuItem = fileMenu.submenu?.items.find(subItem => subItem.label === 'Quit');
            quitMenuItem?.click();
        });

        await helper.electronApp.waitForEvent('close');
    });
});
