import { expect, test, galata } from '@jupyterlab/galata';

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
  await page.notebook.createNew();

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

test.describe('Tests with headless set to false', () => {
  test.use({
    mockSettings: {
      ...galata.DEFAULT_SETTINGS,
      'jupyterlab-jhub-apps:commands': {
        queryParameters: { headless: 'false' }
      }
    }
  });

  const testCases = [
    { name: 'My Notebook.ipynb', expected: 'My%20Notebook.ipynb' },
    { name: 'Untitled.ipynb', expected: 'Untitled.ipynb' },
    {
      name: 'special!@#$%^&*().ipynb',
      expected: 'special!%40%23%24%25%5E%26*().ipynb'
    }
  ];

  testCases.forEach(({ name, expected }) => {
    test(`Should generate correct encoding for notebook named "${name}"`, async ({
      page,
      context,
      tmpPath
    }) => {
      await page.notebook.createNew(name);
      await page.getByLabel(name).getByText('Deploy App').click();

      const newPage = await context.waitForEvent('page');
      await newPage.waitForLoadState('load');

      const filepathParam = newPage.url().split('filepath=')[1];
      expect(filepathParam).toBe(tmpPath + '%2F' + expected);

      await newPage.close();
    });
  });

  test('Check that the filepath parameter is empty when no widget is present', async ({
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
    expect(url.searchParams.has('filepath')).toBe(true);

    const filepathParam = url.searchParams.get('filepath');
    expect(filepathParam).toBe('');

    await newPage.close();
  });
});

test.describe('Tests with headless set to true', () => {
  const baseUrl = '/services/japps/create-app';

  test.use({
    mockSettings: {
      ...galata.DEFAULT_SETTINGS,
      'jupyterlab-jhub-apps:commands': {
        queryParameters: { headless: 'true' },
        baseUrl: baseUrl
      }
    }
  });

  const testCases = [
    { name: 'My Notebook.ipynb', expected: 'My%20Notebook.ipynb' },
    { name: 'Untitled.ipynb', expected: 'Untitled.ipynb' },
    {
      name: 'special!@#$%^&*().ipynb',
      expected: 'special!%40%23%24%25%5E%26*().ipynb'
    }
  ];

  testCases.forEach(({ name, expected }) => {
    test(`Should generate correct encoding for notebook named "${name}"`, async ({
      page,
      tmpPath
    }) => {
      await page.notebook.createNew(name);

      const requestPromise = page.waitForRequest(
        request =>
          request
            .url()
            .includes(
              `${baseUrl}?headless=true&filepath=${tmpPath}%2F${expected}`
            ) && request.method() === 'GET'
      );

      await page.getByLabel(name).getByText('Deploy App').click();

      expect(page.getByRole('tab', { name: 'Deploy App' })).toBeVisible();
      expect(await requestPromise).toBeTruthy();
    });
  });

  test('Check that the filepath parameter is empty when no widget is present', async ({
    page
  }) => {
    const requestPromise = page.waitForRequest(
      request =>
        request.url().includes(`${baseUrl}?headless=true&filepath=`) &&
        request.method() === 'GET'
    );

    await page.click('text=Services');
    await page.locator('.lm-Menu-item:has-text("Deploy App")').click();

    expect(await requestPromise).toBeTruthy();
  });
});

test.describe('Should register custom commands', () => {
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

test('should restore correct state', async ({ page }) => {
  await page.notebook.createNew('Untitled.ipynb');
  await page.getByLabel('Untitled.ipynb').getByText('Deploy App').click();
  expect(
    page.getByRole('tab', { name: 'Deploy App', selected: true })
  ).toBeVisible();

  await page.notebook.createNew('Untitled1.ipynb');
  await page.getByLabel('Untitled1.ipynb').getByText('Deploy App').click();
  expect(
    page.getByRole('tab', { name: 'Deploy App', selected: true })
  ).toBeVisible();

  // opens the same form again - this should not be restored
  // below as duplicates should not be restored
  await page.getByRole('tab', { name: 'Untitled1.ipynb' }).click();
  await page.getByLabel('Untitled1.ipynb').getByText('Deploy App').click();
  expect(
    page.getByRole('tab', { name: 'Deploy App', selected: true })
  ).toBeVisible();

  // not ideal, but need to wait some time for the state to be saved
  await page.waitForTimeout(3000);

  // important, see https://github.com/jupyterlab/jupyterlab/issues/14350
  await page.reload({ waitForIsReady: false });

  // not ideal, but due to previous bug need time for page reload to complete
  await page.waitForTimeout(3000);

  const mainPanel = page.locator("#jp-main-dock-panel");

  expect(await mainPanel.screenshot()).toMatchSnapshot('multiple-tabs.png');
});
