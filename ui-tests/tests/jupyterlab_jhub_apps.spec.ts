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
  await page.notebook.createNew();

  await page.waitForSelector('.jp-NotebookPanel-toolbar');

  const deployAppIcon = page.locator(
    '.jp-Toolbar-item[data-jp-item-name="deploy-app"]'
  );
  await expect(deployAppIcon).toBeVisible();

  // hack to hide kernel status indicator - otherwise toggle between idle and busy on startup
  // and test will fail randomly
  await page.evaluate(() => {
    const kernelStatus = document.querySelector(
      '.jp-NotebookPanel-toolbar .jp-Notebook-ExecutionIndicator'
    ) as HTMLElement;
    if (kernelStatus) {
      kernelStatus.style.display = 'none';
    }
  });

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

test.describe('Deploy App with different notebook names to test URL encoding', () => {
  const testCases = [
    { name: 'My Notebook.ipynb', expected: 'My%20Notebook.ipynb' },
    { name: 'Untitled.ipynb', expected: 'Untitled.ipynb' },
    {
      name: 'special!@#$%^&*().ipynb',
      expected: 'special!%40%23%24%25%5E%26*().ipynb'
    }
  ];

  testCases.forEach(({ name, expected }) => {
    test(`should generate correct encoding for "${name}"`, async ({
      page,
      context,
      tmpPath
    }) => {
      await page.notebook.createNew(name);

      const notebookItem = page
        .locator('.jp-DirListing-item[data-isdir="false"]')
        .first();
      await notebookItem.click({ button: 'right' });
      const deployAppOption = page.locator(
        '.lm-Menu-item:has-text("Deploy App")'
      );
      await deployAppOption.click();

      const newPage = await context.waitForEvent('page');
      await newPage.waitForLoadState('load');

      const fullUrl = newPage.url();
      const filepathParam = fullUrl.split('filepath=')[1];
      expect(filepathParam).toBe(tmpPath + '%2F' + expected);

      await newPage.close();
    });
  });
});

test('check that the filepath parameter is not present in the URL when no notebook is open', async ({
  page,
  context
}) => {
  const newPagePromise = context.waitForEvent('page');

  await page.evaluate(() => {
    window.jupyterapp.commands.execute('jhub-apps:deploy-app');
  });

  const newPage = await newPagePromise;

  await newPage.waitForLoadState('load');

  const url = new URL(newPage.url());
  expect(url.searchParams.has('filepath')).toBe(false);

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
