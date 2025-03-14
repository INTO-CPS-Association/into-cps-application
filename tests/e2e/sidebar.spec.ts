import { test, expect } from "@playwright/test";
import { TestHelper } from "./TestHelpers/TestHelper";

const helper = new TestHelper();

test.describe("Sidebar Interactions", () => {
    test.beforeAll(async () => {
        await helper.launch();
        await helper.startCoverage();
    });

    test.afterAll(async () => {
        const coverageList = await helper.stopCoverage();
        await helper.addCoverageToReport(coverageList);
        await helper.shutdown();
    });

    test("Toggling sidebar should update width", async () => {
        if (!helper.window) throw new Error("Window is not initialized");
    
        const sidebar = helper.window.locator(".MuiDrawer-root");
        const toggleButton = helper.window.locator(".MuiIconButton-root");
    
        await toggleButton.click();
        await expect(sidebar).toHaveCSS("width", "64px");
    
        await toggleButton.click();
        await expect(sidebar).toHaveCSS("width", "240px");
    });
    
});