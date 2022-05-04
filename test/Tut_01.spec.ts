import { test, expect } from "@playwright/test";
import { TestHelper } from "./TestHelpers/Testhelper"

const helper = new TestHelper();

/* 
    Includes:
        - Multi-Models
          - Simulation
            - If offline -> launch
            - Test simulation
*/

test.describe("Tutorial 1", async () => {
  test.beforeAll(async () => {
    await helper.launch("test1_data.zip");
  });

  test.afterAll(async () => {
    await helper.shutdown();
  });

  // Step 1
  test('Should have name Three Tank', async () => {
    const project = await helper.electronApp.evaluate(async (e: any) => {
      return await e.app.getIProject();
    });
    expect(project.name).toBe("Three Tank");
  });

  // Step 2
  test('Open Multi-Model from sidebar', async () => {
    //Find multimodel with text and go to the parent that got the on click event
    await helper.window.locator('text=Non-3D >> xpath=../../../../..')
      .dblclick();
    expect(await helper.window.innerText('#activeTabTitle'))
      .toBe("Non-3D");
  });

  // Step 3
  test('Click on the +', async () => {
    expect(await helper.window.locator('text=Experiment1 >> xpath=../../../../../..')
      .getAttribute('style')
      .then(n => n.includes('display: none;'))
    ).toBe(true); //pr default the element is hidden

    //Find multimodel -> go to parent -> find element with class and click
    await helper.window.locator('text=Non-3D >> xpath=../.. >> td.w2ui-node-dots')
      .click();
    expect(await helper.window.locator('text=Experiment1 >> xpath=../../../../../..')
      .getAttribute('style')
      .then(n => n.includes('display: none;'))
    ).toBe(false);
  });

  // Step 4
  test('Go to Non-3D > Experiment1 from sidebar', async () => {
    await helper.window.locator('text=Experiment1 >> xpath=../../../../..')
      .dblclick();
    expect(await helper.window.innerText('#activeTabTitle'))
      .toBe('Non-3D > Experiment1');
  });

  // Step 5
  test('Co-Simulation engine is offline', async () => {
    await helper.window.locator('#Simulation').click();

    expect(await helper.window.locator('#Simulation >> xpath=div/div/coe-launch/div')
      .innerText()
      .then(n => n.includes('Co-Simulation Engine offline'))
    ).toBe(true);
  });

  // Step 6
  test('Launch button says Launch', async () => {
    expect(await helper.window.locator('#Simulation >> xpath=div/div/coe-launch/div/button')
      .innerText()
      .then(n => n.includes('Launch'))
    ).toBe(true);
  });

  // Step 7
  test('Simulate button is disabled', async () => {
    expect(await helper.window.locator('#Simulation >> xpath=div/div/coe-simulation/div/div/button')
      .isDisabled()
    ).toBe(true);
  });

  // Step 8
  test('Co-Simulation Engine Online', async () => {

    await helper.window.locator('#Simulation >> xpath=div/div/coe-launch >> .alert.alert-danger >> button')
      .click();

    await helper.window.locator('#Simulation >> xpath=div/div/coe-launch >> .alert.alert-success').waitFor();

    expect(await helper.window.locator('#Simulation >> xpath=div/div/coe-launch/div')
    .innerText()
    ).toMatch(/maestroV.+, online at .+\./);
  });

  // Step 9
  test('Simulate button is enabled', async () => {
    expect(await helper.window.locator('#Simulation >> xpath=div/div/coe-simulation/div/div/button')
      .isDisabled()
    ).toBe(false);
  });

  // Step 10
  test('Simulate button shows simulate', async () => {
    expect(await helper.window.locator('#Simulation >> xpath=div/div/coe-simulation/div/div/button')
    .innerText()
    ).toMatch('Simulate');
  });

  // Step 11
  test('Simulate button shows Stop after clicking', async () => {
    await helper.window.locator('#Simulation >> xpath=div/div/coe-simulation/div/div/button').click();
    expect(await helper.window.locator('#Simulation >> xpath=div/div/coe-simulation/div/div/button')
      .innerText()
      ).toMatch('Stop');
  });
  
  // Step 12
  test('Click Edit button to change the Co-Simulation parameters', async () => {
    await helper.window.locator('#Configuration').click();
    await helper.window.locator('#Configuration >> xpath=div/div/coe-configuration/form/button').first().click();
    expect(await helper.window.locator('#Configuration >> xpath=div/div/coe-configuration/form/button')
      .first()
      .innerText()
    ).toMatch('Save');
  });

  test('Change Start Time Co-Simulation parameter', async () => {
    await helper.window.locator('text=Start timeEnd timeAlgorithmFixed StepVariable StepStep size >> input')
      .first()
      .fill('7');
    await helper.window.locator('#Configuration >> xpath=div/div/coe-configuration/form/button')
      .first()
      .click();
    expect(await helper.window.locator('text=Start time 7 >> div')
    .innerText()
    ).toMatch('7');
  });
});
