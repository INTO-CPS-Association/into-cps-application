import { test, expect } from "@playwright/test";
import { TestHelper } from "../TestHelpers/TestHelper";

const helper = new TestHelper();

test.describe("General App Tests", () => {
    test.beforeAll(async () => {
        await helper.launch();
        await helper.startCoverage();
    });

    test.afterAll(async () => {
        const coverageList = await helper.stopCoverage();
        await helper.addCoverageToReport(coverageList);
        await helper.shutdown();
    });

    test("App should launch successfully with correct title", async () => {
        if (!helper.electronApp) throw new Error("Electron app is not initialized");

        const windowCount = helper.electronApp.windows().length;
        expect(windowCount).toBeGreaterThan(0);

        if (!helper.window) throw new Error("Window is not initialized");

        // Aggiungi un attesa per il caricamento completo della finestra
        await helper.window.waitForLoadState("domcontentloaded");

        const title = await helper.window.title();
        console.log("Window title:", title); // Log per verificare il titolo
        expect(title).toContain("INTO-CPS App");
    });

    test("App should have Sidebar and Bottom components visible", async () => {
        if (!helper.window) throw new Error("Window is not initialized");

        const sidebar = helper.window.locator(".MuiDrawer-root");
        const bottomNavigation = helper.window.locator(".MuiBottomNavigation-root");

        // Aggiungi attesa per assicurarsi che i componenti siano resi visibili
        await sidebar.waitFor({ state: "attached" });
        await bottomNavigation.waitFor({ state: "attached" });

        await expect(sidebar).toBeVisible();
        await expect(bottomNavigation).toBeVisible();
    });
});
