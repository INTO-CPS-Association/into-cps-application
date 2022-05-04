import { test, expect } from "@playwright/test";
import { TestHelper } from "./TestHelpers/Testhelper"

const helper = new TestHelper();

/* 
    Includes:
        - Multi-Models
          - Configuration
            - FMU load
            - FMU add instances
            - FMU connections
            - FMU initial values
          - Co-Sim config
            - Configuration
              - Step
              - Live plotting - single connection
*/

test.describe("Tutorial 2", async () => {
  test.beforeAll(async () => {
    await helper.launch("test2_data.zip");
  });

  test.afterAll(async () => {
    await helper.shutdown();
  });

  test('Should have tutorial 2 loaded', async () => {
    await helper.electronApp.evaluate((eApp: any) => {
      return eApp.app.getIProject();
    }).then((n: any) => {
      expect(n.name).toBe('INTO-CPS_Tutorial');
    });
  });

  test('Should be able to open MM', async () => {
    await helper.window.locator('#node_ProjectBrowserItem_21')
      .dblclick();
    expect(await helper.window.innerText('#activeTabTitle'))
      .toBe("mm-3DRobot");
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

  test('Should be able to add a new FMU', async () => {
    await helper.window.locator('#Configuration >> text=FMUs >> button')
      .click();
    expect(await helper.window.locator('#fmu')
      .nth(4)
      .inputValue()
    ).toMatch('FMU');
  });

  test('Rename the new entry to controller', async () => {
  await helper.window.locator('#fmu')
      .nth(4)
      .fill('controller');
    expect(await helper.window.locator('#fmu')
      .nth(4)
      .inputValue()
      ).toMatch('controller');
  });

  test('Should be able to add Controller.fmu to path', async () => {
    await helper.window.locator('input[type="text"]')
      .nth(4)
      .fill('LFRController.fmu')
    expect(await helper.window.locator('input[type="text"]')
      .nth(4)
      .inputValue()
      ).toMatch('LFRController.fmu');
  });

  test('Add an instance of controller', async () => {
    await helper.window.locator('text={controller}')
      .click();
    await helper.window.locator('#fmu_instance')
      .click();
    expect(await helper.window.locator('text=FMU{b}{sensor2}{3D}{sensor1}{controller}Instances >> input')
      .inputValue()
      ).toMatch('controllerInstance');
  });

  test('Can connect controller to left Servo',async () => {
    await helper.window.locator('#outputinstancecontrollerInstance')
      .click();
    await helper.window.locator('text=servoLeftVal')
      .click();
    await helper.window.locator('#inputinstanceb')
      .click();
    await helper.window.locator('text=servo_left_input')
      .click();
    expect(await helper.window.locator('text=servo_left_input')
      .isChecked()
      ).toBeTruthy();
  });

  test('Can connect controller to right Servo', async () => {
    await helper.window.locator('#outputinstancecontrollerInstance')
    .click();
    await helper.window.locator('text=servoRightVal')
      .click();
    await helper.window.locator('#inputinstanceb')
      .click();
    await helper.window.locator('text=servo_right_input')
      .click();
    expect(await helper.window.locator('text=servo_right_input')
      .isChecked()
      ).toBeTruthy(); 
  });

  test('Can connect Sensor1 to controller', async () => {
    await helper.window.locator('#outputinstancesensor1')
      .click();
    await helper.window.locator('a:has-text("lf_1_sensor_reading")')
      .click();
    await helper.window.locator('#inputinstancecontrollerInstance')
      .click();
    await helper.window.locator('text=lfLeftVal')
      .click();
    expect(await helper.window.locator('text=lfLeftVal')
      .isChecked()
      ).toBeTruthy(); 
  });

  test('Can connect Sensor2 to controller', async () => {
    await helper.window.locator('#outputinstancesensor2')
      .click();
    await helper.window.locator('a:has-text("lf_1_sensor_reading")')
      .click();
    await helper.window.locator('#inputinstancecontrollerInstance')
      .click();
    await helper.window.locator('text=lfRightVal')
      .click();
    expect(await helper.window.locator('text=lfRightVal')
      .isChecked()
      ).toBeTruthy(); 
  });

  test('Can add and set controller backwardRotate parameter', async () => {
    await helper.window.locator('#initialvalcontrollerInstance')
      .click();
    await helper.window.locator('#addParameters')
      .click();
    await helper.window.locator('#backwardRotate')
      .fill('0.1');
    expect(await helper.window.locator('#backwardRotate')
      .inputValue()
      ).toBe('0.1');
  });
  
  test('Can add and set controller forwardRotate parameter', async () => {
    await helper.window.locator('#initialvalcontrollerInstance')
      .click();
    await helper.window.locator('#addParameters')
      .click();
    await helper.window.locator('#forwardRotate')
      .fill('0.5');
    expect(await helper.window.locator('#forwardRotate')
      .inputValue()
      ).toBe('0.5');
  });

  test('Can add and set controller forwardSpeed parameter', async () => {
    await helper.window.locator('#initialvalcontrollerInstance')
      .click();
    await helper.window.locator('#addParameters')
      .click();
    await helper.window.locator('#forwardSpeed')
      .fill('0.4');
    expect(await helper.window.locator('#forwardSpeed')
      .inputValue()
      ).toBe('0.4');
  });

  test('Can save model setup', async () => {
    await helper.window.locator('#Configuration >> xpath=div/div/mm-configuration/form/button')
      .first()
      .click();

    expect(await helper.window.locator('#Configuration >> xpath=div/div/mm-configuration/form/button')
      .first()
      .innerText()
      ).toMatch('Edit');
  });

  test('Saved model setup is correct', async () => {
    expect(helper.ReadJsonFile(helper.testDataPath + "/project/Multi-models/mm-3DRobot/mm.json"))
      .toStrictEqual(helper.ReadJsonFile(helper.testDataPath + "/testdata/mm.json"));
  });

  test('Create a Co-Sim from the MM"', async () => {
    await helper.window.locator('#node_ProjectBrowserItem_21').click({ button: "right" });
    await helper.window.locator('text=Create Co-Simulation Configuration').click();
    await helper.window.locator('text=Ok').click();
    expect(await helper.window.locator('#activeTabTitle').innerText()).toMatch("mm-3DRobot > co-sim");
  });

  test('Edit Step Size to 0.01 under Basic Configuration', async () => {
    await helper.window.locator('#node_ProjectBrowserItem_21 >> text=+').click();
    await helper.window.locator('text=Configuration').click();
    await helper.window.locator('text=Edit').first().click();
    await helper.window.locator('#stepsize').fill('0.01');
    expect(await helper.window.locator('#stepsize').inputValue()).toBe('0.01');
  });

  test('Should add a new live plot and enable sensor1 in live plotting', async () => {
    await helper.window.locator('h4:has-text("Live Plotting")').click();
    await helper.window.locator('text=Add Graph').click();
    await helper.window.locator('#sensor1lf_1_sensor_reading').first().click();
    expect(helper.window.locator('#sensor1lf_1_sensor_reading')
      .isChecked()
      ).toBeTruthy();
  });
});
