import { test, expect } from "@playwright/test";
import { TestHelper } from "../TestHelpers/TestHelper";

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

    test("Initial state: Button should show 'Start CoE'", async () => {
        if (!helper.window) throw new Error("Window is not initialized");

        const buttonText = await helper.window?.locator('#maestro-btn-launch-bottom').innerText();
        expect(buttonText).toContain("Start CoE");
    });
});
