import { test, expect } from "@playwright/test";
import { TestHelper } from "./TestHelpers/TestHelper";

const helper = new TestHelper();

test.describe("init.ts Electron Tests", () => {
    test.beforeAll(async () => {
        await helper.launch();
        await helper.startCoverage();
    });

    test.afterAll(async () => {
        const coverageList = await helper.stopCoverage();
        await helper.addCoverageToReport(coverageList);
        await helper.shutdown();
    });

    const getWindow = async () => {
        if (!helper.electronApp) {
            throw new Error("Electron app is not initialized");
        }
        if (!helper.window) {
            const windows = helper.electronApp.windows();
            if (windows.length === 0) {
                throw new Error("No windows found in the Electron app");
            }
            helper.window = windows[0];
        }
        return helper.window;
    };

    test('InitializationController should configure layout correctly', async () => {
        const window = await getWindow();
        const layoutDiv = window.locator('#layout');
        await expect(layoutDiv).toBeVisible();

        const mainPanel = window.locator('#layout_layout_panel_main .w2ui-panel-content');
        const bottomPanel = window.locator('#layout_layout_panel_bottom .w2ui-panel-content');
        await expect(mainPanel).toBeVisible();
        await expect(bottomPanel).toBeVisible();
    });

    test('InitializationController should set app version', async () => {
        const window = await getWindow();
        const appVersion = window.locator('#appVersion');
        await expect(appVersion).toHaveText('5.0.0');
    });

    test('InitializationController should hide preview panel', async () => {
        const window = await getWindow();
        const previewPanel = window.locator('div.w2ui-panel-content.preview');
        await expect(previewPanel).toBeHidden();
    });

    test('App should have only a "File" menu with a "Quit" option', async () => {
        const menuItems = await helper.getMenuItems();
        
        expect(menuItems.length).toBeGreaterThan(0);
        expect(menuItems.length).toBe(1);
        expect(menuItems[0].label).toBe("File");

        const submenuItems = menuItems[0].submenu;
        expect(submenuItems.length).toBe(1);
        expect(submenuItems[0]).toBe("Quit");
    });
});
