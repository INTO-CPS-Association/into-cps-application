import { test, expect } from "@playwright/test";
import { TestHelper } from "./TestHelpers/Testhelper"

const helper = new TestHelper();

/* 
    Includes:
        - SysML
            - Create model including pop up
        - Multi-Models
            - Overview
                - Issue handling / Unsupported
            - Configuration

*/

test.describe("Tutorial 3", async () => {
  test.beforeAll(async () => {
    await helper.launch("test3_data.zip");
  });

  test.afterAll(async () => {
    await helper.shutdown();
  });
  test('Should have name INTO-CPS_Tutorial', async () => {
    const project = await helper.electronApp.evaluate(async (e: any) => {
      return await e.app.getIProject();
    });
    expect(project.name).toBe("INTO-CPS_Tutorial");
  });

  test('Right click on 3D Robot SysML and create multi model', async () => {
    // Click text=+
    await helper.window.locator('text=+').click();
    await helper.window.locator('text=+').click();
    await helper.window.locator('#node_ProjectBrowserItem_18').click({ button: 'right' });
    await helper.window.locator('text=Create Multi-Model').click();
    await helper.window.locator('text=Ok').click();
    expect(await helper.window.locator('#node_ProjectBrowserItem_19').innerText())
      .toMatch('mm-3DRobot');
  });

  test('Should contain errors as FMU paths are not defined', async () => {
    expect(await helper.window.locator('div:nth-child(2) div:nth-child(10) div >> nth=0 >> div').count()
    ).toBeGreaterThan(10);
  });

  test('Should be able to open the Configuration pane and click Edit button', async () => {
    await helper.window.locator('#Configuration')
      .click();
    await helper.window.locator('#Configuration >> xpath=div/div/mm-configuration/form/button')
      .first()
      .click();
    expect(await helper.window.locator('#Configuration >> xpath=div/div/mm-configuration/form/button')
      .first()
      .innerText()
    ).toMatch('Save');
  });

  test('Should set the Path for c (Controller)', async () => {
    await helper.window.locator('input[type="text"] >> nth=0').fill('LFRController.fmu');
    expect(await helper.window.locator('input[type="text"] >> nth=0').inputValue()).toBe('LFRController.fmu');
  });

  test('Should set the Path for b (Body)', async () => {
    await helper.window.locator('input[type="text"] >> nth=1').fill('Body_Block.fmu');
    expect(await helper.window.locator('input[type="text"] >> nth=1').inputValue()).toBe('Body_Block.fmu');
  });
  // FMU Not supported  
//   test('Should set the Path for 3D (3D Animation)', async () => {
//     await helper.window.locator('input[type="text"] >> nth=2').fill('3DanimationFMU.fmu');
//     expect(await helper.window.locator('input[type="text"] >> nth=2').inputValue()).toBe('3DanimationFMU.fmu');
//   });

  test('Should set the Path for sensor1', async () => {
    //Remove unsupported FMU
    await helper.window.locator('#fmu2 .col-md-1 .btn').click();

    await helper.window.locator('input[type="text"] >> nth=2').fill('Sensor_Block_01.fmu');
    expect(await helper.window.locator('input[type="text"] >> nth=2').inputValue()).toBe('Sensor_Block_01.fmu');
  });

  test('Should set the Path for sensor2', async () => {
    await helper.window.locator('input[type="text"] >> nth=3').fill('Sensor_Block_02.fmu');
    expect(await helper.window.locator('input[type="text"] >> nth=3').inputValue()).toBe('Sensor_Block_02.fmu');
  });

  test('Should be able to save configuration"', async () => {
    await helper.window.locator('#Configuration >> xpath=div/div/mm-configuration/form/button').first().click();

    expect(await helper.window.locator('#Configuration >> xpath=div/div/mm-configuration/form/button')
      .first()
      .innerText()
      ).toMatch('Edit');
  });

  test('Set sensor1 y position', async () => {
    // Edit
    await helper.window.locator('#Configuration >> xpath=div/div/mm-configuration/form/button').first().click();
    await helper.window.locator('#initialvalsensor1').click();
    await helper.window.locator('#lf_position_y').fill('0.065');
    // Save
    await helper.window.locator('#Configuration >> xpath=div/div/mm-configuration/form/button').first().click();
    await helper.window.locator('#initialvalsensor1').click();
    expect(await helper.window.locator('text=Real lf_position_y 0 >> div').nth(1).innerText())
      .toBe('0.065')
  });

  test('Create a Co-Sim from the MM', async () => {
    await helper.window.locator('#node_ProjectBrowserItem_19').click({ button: 'right' });
    await helper.window.locator('text=Create Co-Simulation Configuration').click();
    await helper.window.locator('text=Ok').click();
    expect(await helper.window.locator('#activeTabTitle').innerText()).toMatch("mm-3DRobot > co-sim");
  });
});