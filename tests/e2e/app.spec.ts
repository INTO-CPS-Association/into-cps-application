import { test, expect } from "@playwright/test";
import { TestHelper } from "./TestHelpers/TestHelper";

const helper = new TestHelper();

test.describe("Application Initialization", () => {
    test.beforeAll(async () => {
        await helper.launch();
        if (!helper.electronApp) throw new Error("Electron App failed to launch");
        await helper.startCoverage();
        
    });

    test.afterAll(async () => {
        const coverageList = await helper.stopCoverage();
        await helper.addCoverageToReport(coverageList);
        await helper.shutdown();
    });

    test("App window should open with the correct title", async () => {
        if (!helper.window) throw new Error("Window is not initialized");
        const title = await helper.window.title();
        expect(title).toMatch(/INTO-CPS App/);
    });

    test("Sidebar should be visible", async () => {
        if (!helper.window) throw new Error("Window is not initialized");

        await expect(helper.window.locator(".MuiDrawer-root")).toBeVisible();
    });
});