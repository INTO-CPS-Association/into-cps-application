import { test, expect } from "@playwright/test";
import { TestHelper } from "../TestHelpers/TestHelper";

const helper = new TestHelper();

test.describe("Initialization Tests", () => {
    test.beforeAll(async () => {
        await helper.launch();
        await helper.startCoverage();
    });

    test.afterAll(async () => {
        const coverageList = await helper.stopCoverage();
        await helper.addCoverageToReport(coverageList);
        await helper.shutdown();
    });

    test("App version should be displayed correctly", async () => {
        if (!helper.window) throw new Error("Window is not initialized");

        const appVersion = helper.window.locator("#appVersion");
        await expect(appVersion).toHaveText("5.0.0");
    });

    test("Menu should contain only 'File' menu with 'Quit' option", async () => {
        const menuItems = await helper.getMenuItems() as { label: string; submenu: string[] }[];

        expect(menuItems.length).toBe(1);
        expect(menuItems[0].label).toBe("File");

        const submenuItems = menuItems[0].submenu;
        expect(submenuItems.length).toBe(1);
        expect(submenuItems[0]).toBe("Quit");
    });
});