import { test, expect } from "@playwright/test";
import { TestHelper } from "./TestHelpers/Testhelper"

const helper = new TestHelper();


test.describe("Tutorial 9", async () => {
  test.beforeAll(async () => {
    await helper.launch("test9_data.zip");
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

  test('Should be able to start COE from lfr-3d multi-model', async () => {
    await helper.window.locator('text=+').click();
    await helper.window.locator('#node_ProjectBrowserItem_12').dblclick();
    await helper.window.locator('#Simulation div:has-text("Simulation") >> nth=1').click();
    await helper.window.locator('#Simulation >> text=Launch').click();
    await helper.window.locator('#Simulation >> xpath=div/div/coe-launch >> .alert.alert-success').waitFor();
    expect(await helper.window.locator('#Simulation >> xpath=div/div/coe-launch/div')
    .innerText()
    ).toMatch(/maestroV.+, online at .+\./);
  });

  test('Should open lfr-non3d', async () => {
    await helper.window.locator('#node_ProjectBrowserItem_14').dblclick();
    expect(await helper.window.locator('#activeTabTitle').innerText()).toMatch('lfr-non3d');
  });

  test('Should open edit mode of the mm', async () => {
    await helper.window.locator('#Configuration div:has-text("Configuration") >> nth=1').click();
    await helper.window.locator('text=Edit >> nth=0').click();
    expect(await helper.window.locator('#Configuration >> xpath=div/div/mm-configuration/form/button')
    .first()
    .innerText()
    ).toMatch('Save');
  });

  test('Should set ambient light for sensor 1', async () => {
    await helper.window.locator('#initialvalsensor1').click();
    await helper.window.locator('#ambient_light').fill('25');
    expect(await helper.window.locator('#ambient_light').inputValue()).toBe('25');
  });

  test('Should set ambient light for sensor 2', async () => {
    await helper.window.locator('#initialvalsensor2').click();
    await helper.window.locator('#ambient_light').fill('25');
    expect(await helper.window.locator('#ambient_light').inputValue()).toBe('25');
  });

  test('Should set noise for sensor 1', async () => {
    await helper.window.locator('#initialvalsensor1').click();
    await helper.window.locator('#noise_level').fill('4');
    expect(await helper.window.locator('#noise_level').inputValue()).toBe('4');
  });

  test('Should set noise for sensor 2', async () => {
    await helper.window.locator('#initialvalsensor2').click();
    await helper.window.locator('#noise_level').fill('4');
    expect(await helper.window.locator('#noise_level').inputValue()).toBe('4');
  });

});