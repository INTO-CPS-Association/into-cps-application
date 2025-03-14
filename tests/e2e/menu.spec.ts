import { expect, test } from '@playwright/test';
import { 
  clickMenuItemById,
  parseElectronApp,
} from 'electron-playwright-helpers';
import { ElectronApplication, Page, _electron as electron } from 'playwright';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
    const appInfo = parseElectronApp("release/linux-unpacked");
  
    electronApp = await electron.launch({
      args: [appInfo.main],
      executablePath: appInfo.executable,
    });
  
    page = await electronApp.firstWindow();
    await page.waitForLoadState();
  });
  

test.afterAll(async () => {
  await electronApp.close();
});


test("Menu should have 'File', 'View', and 'Cosimulation' options", async () => {
  const menuItems = await electronApp.evaluate(({ Menu }) => {
    return Menu.getApplicationMenu()?.items
      .filter(item => ["File", "View", "Cosimulation"].includes(item.label)) // Filtra solo i menu definiti
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
  const initialColorScheme = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).getPropertyValue('color-scheme').trim();
  });

  await clickMenuItemById(electronApp, 'toggle-dark-mode');
  await page.waitForTimeout(500);

  const newColorScheme = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).getPropertyValue('color-scheme').trim();
  });

  console.log("Initial color scheme:", initialColorScheme);
  console.log("New color scheme:", newColorScheme);

  expect(newColorScheme).not.toBe(initialColorScheme);
  expect(["light", "dark"]).toContain(newColorScheme);
});