import { test, expect } from "@playwright/test";
import { TestHelper } from "../../TestHelpers/TestHelper";

const helper = new TestHelper();

test.describe("Maestro Button Tests", () => {
    test.beforeAll(async () => {
        await helper.launch();
        await helper.startCoverage();
    });

    test.afterAll(async () => {
        const coverageList = await helper.stopCoverage();
        await helper.addCoverageToReport(coverageList);
        await helper.shutdown();
    });

    test("Initial state: Button should show 'Start CoE' with primary icon color", async () => {
        if (!helper.window) throw new Error("Window is not initialized");

        const buttonText = await helper.window?.locator('#maestro-btn-launch-bottom').innerText();
        expect(buttonText).toContain("Start CoE");

        const icon = helper.window.locator("#maestroIconColor");
        const iconColor = await icon.evaluate((iconElement) => iconElement.getAttribute("color"));
        expect(iconColor).toBe("primary");
    });

    test("Clicking button: Should change to 'Stop CoE' with error icon color", async () => {
        if (!helper.window) throw new Error("Window is not initialized");

        const button = helper.window.locator("#maestro-btn-launch-bottom");
        await button.click();

        const buttonText = await helper.window?.locator('#maestro-btn-launch-bottom p').innerText();
        expect(buttonText).toContain("Stop CoE");

        const icon = helper.window.locator("#maestroIconColor");
        const iconColor = await icon.evaluate((iconElement) => iconElement.getAttribute("color"));
        expect(iconColor).toBe("error");
    });

    test("Clicking 'Stop CoE' again: Should change back to 'Start Maestro' with primary icon color", async () => {
        if (!helper.window) throw new Error("Window is not initialized");

        const button = helper.window.locator("#maestro-btn-launch-bottom");
        await button.click();
        await button.click();

        const buttonText = await helper.window?.locator('#maestro-btn-launch-bottom p').innerText();
        expect(buttonText).toContain("Start CoE");

        const icon = helper.window.locator("#maestroIconColor");
        const iconColor = await icon.evaluate((iconElement) => iconElement.getAttribute("color"));
        expect(iconColor).toBe("primary");
    });
});