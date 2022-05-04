import { test, expect } from "@playwright/test";
import { TestHelper } from "./TestHelpers/Testhelper"

const helper = new TestHelper();

/* 
    Includes:
        - DSE Configuration

*/

test.describe("Tutorial 7", async () => {
  test.beforeAll(async () => {
    await helper.launch("test7_data.zip");
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

  test('Open DSE Page', async () => {
    await helper.window.locator('#node_ProjectBrowserItem_3').dblclick();
    expect(await helper.window.locator('#activeTabTitle').innerText()).toMatch('dse-DSE Example-78');
  });

  test('Should be able to open and edit DSE configuration', async () => {
    await helper.window.locator('#layout_layout_panel_main div:has-text("DSE Configuration") >> nth=2').click();
    await helper.window.locator('#btn-edit').click();
    expect(await helper.window.locator('#btn-save').innerText()).toMatch('Save');
  });

  test('Select the Experiment/lfr-non3d multi model', async () => {
    //await helper.window.locator('text=Co-simulation experimentExperiment | lfr-non3d >> select').click();
    await helper.window.locator('text=Co-simulation experimentExperiment | lfr-non3d >> select')
      .selectOption({ index: 0 });
    expect(await helper.window.locator('select.form-control.ng-valid.ng-dirty').innerText())
      .toMatch('lfr-non3d');
  });

  test('Set algorithm to exhaustive', async () => {
    await helper.window.locator('text=Search AlgorithmExhaustiveGenetic >> select')
      .selectOption({ index: 0 });
    expect(await helper.window.locator('text=Search AlgorithmExhaustiveGenetic >> select').innerText())
      .toMatch('Exhaustive');
  });

  test('Should add a constraint on the y position', async () => {
    await helper.window.locator('#AddConstraints').click();
    await helper.window.locator('#conparameter0')
      .fill('{sensor1}.sensor1.lf_position_y == {sensor2FMU}.sensor2.lf_position_y');
    expect(await helper.window.locator('#conparameter0').inputValue())
      .toMatch('{sensor1}.sensor1.lf_position_y == {sensor2FMU}.sensor2.lf_position_y');
  });

  test('Should add a constraint on the x position', async () => {
    await helper.window.locator('#AddConstraints').click();
    await helper.window.locator('#conparameter1')
      .fill('{sensor1}.sensor1.lf_position_x == - {sensor2FMU}.sensor2.lf_position_x');
    expect(await helper.window.locator('#conparameter1').inputValue())
      .toMatch('{sensor1}.sensor1.lf_position_x == - {sensor2FMU}.sensor2.lf_position_');
  });

  test('Should set studentMap in the scenario', async () => {
    await helper.window.locator('#scenarios0').fill('studentMap');
    expect(await helper.window.locator('#scenarios0').inputValue()).toMatch('studentMap');
  });

  test('Should be able to save the configuration', async () => {
    await helper.window.locator('text=Save >> nth=1').click();
    expect(await helper.window.locator('text=Edit >> nth=1').innerText()).toMatch('Edit');
  });
});