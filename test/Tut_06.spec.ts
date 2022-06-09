import { test, expect } from "@playwright/test";
import { TestHelper } from "./TestHelpers/Testhelper"

const helper = new TestHelper();

/* 
    Includes:
        - DSE Configuration

*/

test.describe("Tutorial 6", async () => {
  test.beforeAll(async () => {
    await helper.launch("test6_data.zip");
  });

  test.afterAll(async () => {
    await helper.shutdown();
  });

  test('Should have name no name', async () => {
    const project = await helper.electronApp.evaluate(async (e: any) => {
      return await e.app.getIProject();
    });
    expect(project.name).toBe("");
  });

  test('Right click on the configuration file and create DSE configuration', async () => {
    await helper.window.locator('text=+').click();
    await helper.window.locator('text=+').click();
    await helper.window.locator('#node_ProjectBrowserItem_13').click({ button: 'right' });
    await helper.window.locator('text=Create DSE Configuration').click();
    await helper.window.locator('#node_ProjectBrowserItem_14').dblclick();
    expect(await helper.window.locator('#activeTabTitle').innerText()).toMatch('dse-DSE_Example');
  });


});