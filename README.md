# jupyterlab_jhub_apps

[![Github Actions Status](https://github.com/nebari-dev/jupyterlab-jhub-apps/workflows/Build/badge.svg)](https://github.com/nebari-dev/jupyterlab-jhub-apps/actions/workflows/build.yml)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/nebari-dev/jupyterlab-jhub-apps/main?urlpath=lab)

Customizations for [jhub-apps](https://github.com/nebari-dev/jhub-apps).

## Plugins

- `jhub-apps:deploy-app`: Adds a command to deploy an app from the currently active widget. This command is available from the main menu and context menu, as well as a toolbar icon for both files and notebooks. If there is a path associated with the currently active widget, then this is the path used for deploying the app.

**Toolbar Icon (Notebook):**

![](https://raw.githubusercontent.com/nebari-dev/jupyterlab-jhub-apps/main/ui-tests/tests/jupyterlab_jhub_apps.spec.ts-snapshots/notebook-toolbar-before-click-linux.png)

**Toolbar Icon (File Editor):**

![](https://raw.githubusercontent.com/nebari-dev/jupyterlab-jhub-apps/main/ui-tests/tests/jupyterlab_jhub_apps.spec.ts-snapshots/file-editor-toolbar-before-click-linux.png)

**Main Menu:**

![](https://raw.githubusercontent.com/nebari-dev/jupyterlab-jhub-apps/main/ui-tests/tests/jupyterlab_jhub_apps.spec.ts-snapshots/services-menu-with-deploy-app-linux.png)

**Context Menu:**

![](https://raw.githubusercontent.com/nebari-dev/jupyterlab-jhub-apps/main/ui-tests/tests/jupyterlab_jhub_apps.spec.ts-snapshots/notebook-context-menu-with-deploy-app-linux.png)

## Requirements

- JupyterLab >= 4.0.0

## Install

To install the extension, execute:

```bash
pip install jupyterlab_jhub_apps
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyterlab_jhub_apps
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab_jhub_apps directory
# Install package in development mode
pip install -e "."
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
pip uninstall jupyterlab_jhub_apps
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jupyterlab-jhub-apps` within that folder.

### Testing the extension

#### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
jlpm
jlpm test
```

#### Integration tests

This extension uses [Playwright](https://playwright.dev/docs/intro) for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](./ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](RELEASE.md)
