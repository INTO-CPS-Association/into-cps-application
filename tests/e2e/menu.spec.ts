import { test, expect } from "@playwright/test";
import { TestHelper } from "./TestHelpers/TestHelper";

const helper = new TestHelper();

test.describe("Menu Test", () => {
  test.beforeAll(async () => {
    await helper.launch();
    if (!helper.electronApp) throw new Error("Electron App failed to launch");
    await helper.startCoverage();

    await helper.electronApp.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.webContents.send("project-selected", "dummy");
    });
  });

  test.afterAll(async () => {
    const coverageList = await helper.stopCoverage();
    await helper.addCoverageToReport(coverageList);
    await helper.shutdown();
  });

  test("Menu should have 'File', 'View', and 'Cosimulation' options", async () => {
    const menuItems = await helper.electronApp!.evaluate(({ Menu }) => {
      return Menu.getApplicationMenu()?.items
        .filter(item => ["File", "View", "Cosimulation"].includes(item.label))
        .map(item => ({
          label: item.label,
          submenu: item.submenu?.items
            .filter(subItem => subItem.type !== "separator")
            .map(subItem => subItem.label) || []
        }));
    });

    expect(menuItems?.length).toBe(3);
    expect(menuItems?.map(item => item.label)).toEqual(["File", "View", "Cosimulation"]);

    const fileSubmenu = menuItems?.find(m => m.label === "File")!.submenu;
    expect(fileSubmenu).toEqual(["Choose Project", "Quit"]);

    const viewSubmenu = menuItems?.find(m => m.label === "View")!.submenu;
    expect(viewSubmenu).toEqual(["Toggle Dark Mode", "Toggle Developer Tools"]);

    const cosimulationSubmenu = menuItems?.find(m => m.label === "Cosimulation")!.submenu;
    expect(cosimulationSubmenu).toEqual(["Start Simulation"]);
  });

  test("Dark mode should toggle correctly", async () => {
    const initialColorScheme = await helper.window!.evaluate(() => {
      return window.getComputedStyle(document.documentElement).getPropertyValue("color-scheme").trim();
    });

    await helper.window!.evaluate(() => {
      // @ts-ignore
      window.electronAPI.toggleDarkMode();
    });

    await helper.window!.waitForTimeout(500);

    const newColorScheme = await helper.window!.evaluate(() => {
      return window.getComputedStyle(document.documentElement).getPropertyValue("color-scheme").trim();
    });

    console.log("Initial:", initialColorScheme, "→ New:", newColorScheme);

    expect(newColorScheme).not.toBe(initialColorScheme);
    expect(["light", "dark"]).toContain(newColorScheme);
  });

});