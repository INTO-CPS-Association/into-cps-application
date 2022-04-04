import { test, expect } from "@playwright/test";
import { TestHelper } from "./TestHelpers/Testhelper"

const helper = new TestHelper();

test.describe("Tutorial 1", async () => {
  test.beforeAll(async () => {
    await helper.launch("test1_data.zip");
  });
  
  test.afterAll(async () => {
    await helper.shutdown();
  });

  test('Should have name Three Tank', async () => {
      const project = await helper.electronApp.evaluate( async (e : any) => {
        return await e.app.getIProject();
      });
      expect(project.name).toBe("Three Tank");
  });

  test('Open Multi-Model from sidebar', async () => {
    //Find multimodel with text and go to the parent that got the on click event
    await helper.window.locator('text=Non-3D >> xpath=../../../../..')
      .dblclick();
    expect(await helper.window.innerText('#activeTabTitle'))
      .toBe("Non-3D");
  });

  test('Click on the +', async () => {
    expect(await helper.window.locator('text=Experiment1 >> xpath=../../../../../..')
    .getAttribute('style')
    .then( n => n.includes('display: none;'))
    ).toBe(true); //pr default the element is hidden

    //Find multimodel -> go to parent -> find element with class and click
    await helper.window.locator('text=Non-3D >> xpath=../.. >> td.w2ui-node-dots')
      .click();
    expect(await helper.window.locator('text=Experiment1 >> xpath=../../../../../..')
      .getAttribute('style')
      .then( n => n.includes('display: none;'))
      ).toBe(false);
  });

  test('Go to Non-3D > Experiment1 from sidebar', async () => {
    await helper.window.locator('text=Experiment1 >> xpath=../../../../..')
      .dblclick();
    expect(await helper.window.innerText('#activeTabTitle'))
      .toBe('Non-3D > Experiment1');
  });

});
