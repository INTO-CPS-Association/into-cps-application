import { test, expect } from "@playwright/test";
import { TestHelper } from "../TestHelpers/TestHelper";

const helper = new TestHelper();

test.describe("COE Button Tests", () => {
    test.beforeAll(async () => {
        await helper.launch();
        await helper.startCoverage();
    });

    test.afterAll(async () => {
        const coverageList = await helper.stopCoverage();
        await helper.addCoverageToReport(coverageList);
        await helper.shutdown();
    });

    test("Initial state: Button should show 'Start COE' with primary icon color", async () => {
        if (!helper.window) throw new Error("Window is not initialized");

        const buttonText = await helper.window?.locator('#coe-btn-launch-bottom').innerText();
        expect(buttonText).toContain("Start COE");

        const icon = helper.window.locator("#coeIconColor");
        const iconColor = await icon.evaluate((iconElement) => iconElement.getAttribute("color"));
        expect(iconColor).toBe("primary");
    });

    test("Clicking button: Should change to 'Stop COE' with error icon color", async () => {
        if (!helper.window) throw new Error("Window is not initialized");

        const button = helper.window.locator("#coe-btn-launch-bottom");
        await button.click();

        const buttonText = await helper.window?.locator('#coe-btn-launch-bottom p').innerText();
        expect(buttonText).toContain("Stop COE");

        const icon = helper.window.locator("#coeIconColor");
        const iconColor = await icon.evaluate((iconElement) => iconElement.getAttribute("color"));
        expect(iconColor).toBe("error");
    });

    test("Clicking 'Stop COE' again: Should change back to 'Start COE' with primary icon color", async () => {
        if (!helper.window) throw new Error("Window is not initialized");

        const button = helper.window.locator("#coe-btn-launch-bottom");
        await button.click();
        await button.click();

        const buttonText = await helper.window?.locator('#coe-btn-launch-bottom p').innerText();
        expect(buttonText).toContain("Start COE");

        const icon = helper.window.locator("#coeIconColor");
        const iconColor = await icon.evaluate((iconElement) => iconElement.getAttribute("color"));
        expect(iconColor).toBe("primary");
    });
});