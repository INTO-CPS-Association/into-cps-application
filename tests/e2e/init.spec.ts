import { test, expect } from "@playwright/test";
import { TestHelper } from "./TestHelpers/TestHelper";

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
        await expect(appVersion).toHaveText(/5\.0\.0/);
    });

    
    test("Menu should contain 'File', 'View', and 'Cosimulation' with correct options", async () => {
        const menuItems = await helper.getMenuItems() as { label: string; submenu: string[] }[];
    
        expect(menuItems.length).toBe(3);
        expect(menuItems.map(item => item.label)).toEqual(["File", "View", "Cosimulation"]);
    
        const fileMenu = menuItems.find(item => item.label === "File");
        expect(fileMenu).toBeDefined();
    
        const fileMenuItems = fileMenu!.submenu.filter(item => item.trim() !== "");
        expect(fileMenuItems).toEqual(["Choose Project", "Quit"]);
    
        const viewMenu = menuItems.find(item => item.label === "View");
        expect(viewMenu).toBeDefined();
        expect(viewMenu!.submenu).toEqual(["Toggle Dark Mode", "Toggle Developer Tools"]);
    
        const cosimMenu = menuItems.find(item => item.label === "Cosimulation");
        expect(cosimMenu).toBeDefined();
        expect(cosimMenu!.submenu).toEqual(["Start Simulation"]);
      });
});
