import { expect, test } from '@jupyterlab/galata';

test('should have Deploy App entry in Services menu', async ({ page }) => {
  await page.click('text=Services');

  const deployAppEntry = page.locator('.lm-Menu-item:has-text("Deploy App")');
  await expect(deployAppEntry).toBeVisible();

  const servicesMenu = page.locator('.lm-Menu-content');
  expect(await servicesMenu.screenshot()).toMatchSnapshot(
    'services-menu-with-deploy-app.png'
  );
});

test('should have Deploy App icon in notebook toolbar', async ({ page }) => {
  await page.click('text=Python 3');

  await page.waitForSelector('.jp-NotebookPanel-toolbar');

  await page.waitForSelector('.jp-KernelStatus .jp-StatusItem[title*="Idle"]');

  const deployAppIcon = page.locator(
    '.jp-Toolbar-item[data-jp-item-name="deploy-app"]'
  );
  await expect(deployAppIcon).toBeVisible();

  const notebookToolbar = page.locator('.jp-NotebookPanel-toolbar');
  expect(await notebookToolbar.screenshot()).toMatchSnapshot(
    'notebook-toolbar-before-click.png'
  );
});

test('should show Deploy App option in context menu', async ({ page }) => {
  await page.click('text=Python 3');
  await page.waitForSelector('.jp-NotebookPanel');

  await page.waitForSelector('.jp-DirListing-item[data-isdir="false"]');

  const notebookItem = page
    .locator('.jp-DirListing-item[data-isdir="false"]')
    .first();
  await notebookItem.click({ button: 'right' });

  const deployAppOption = page.locator('.lm-Menu-item:has-text("Deploy App")');
  await expect(deployAppOption).toBeVisible();

  const contextMenu = page.locator('.lm-Menu-content');
  expect(await contextMenu.screenshot()).toMatchSnapshot(
    'notebook-context-menu-with-deploy-app.png'
  );
});

test('should open new tab with correct URL when deploy-app command is executed', async ({
  page,
  context
}) => {
  const newPagePromise = context.waitForEvent('page');

  await page.evaluate(() => {
    window.jupyterapp.commands.execute('jhub-apps:deploy-app');
  });

  const newPage = await newPagePromise;

  await newPage.waitForLoadState('load');

  expect(newPage.url()).toBe(
    'http://localhost:8888/services/japps/create-app'
  );

  await newPage.close();
});

test.describe('should register custom commands', () => {
  test('jhub-apps:deploy-app command works', async ({ page }) => {
    const deployAppMainMenu = await page.evaluate(async () => {
      const registry = window.jupyterapp.commands;
      const id = 'jhub-apps:deploy-app';
      const args = { origin: 'main-menu' };

      return {
        id,
        label: registry.label(id, args),
        isEnabled: registry.isEnabled(id, args)
      };
    });

    expect(deployAppMainMenu.label).toBe('Deploy App');

    expect(deployAppMainMenu.isEnabled).toBe(true);
  });
});
