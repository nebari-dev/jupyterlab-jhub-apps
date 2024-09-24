import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { deployAppIcon } from './icons';
import { DocumentWidget } from '@jupyterlab/docregistry';

namespace CommandIDs {
  /**
   * Opens the URL to deploy the application with pre-populated fields
   */
  export const deployApp = 'jhub-apps:deploy-app';
}

interface IDeployAppArgs {
  /**
   * The origin of the command e.g. main-menu, context-menu, etc.
   */
  origin?: string;
}

const jhubAppsPlugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-jhub-apps:commands',
  description: 'Adds additional commands used by jhub-apps.',
  autoStart: true,
  requires: [],
  activate: async (app: JupyterFrontEnd) => {
    const openURL = async (url: string) => {
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch (error) {
        console.warn(`Error opening ${url}: ${error}`);
      }
    };

    const calculateIcon = (args: IDeployAppArgs) => {
      switch (args.origin) {
        case 'main-menu':
          return undefined;
        case 'context-menu':
          return deployAppIcon;
        case undefined:
          return deployAppIcon;
        default:
          return deployAppIcon;
      }
    };

    app.commands.addCommand(CommandIDs.deployApp, {
      execute: async () => {
        const currentWidget = app.shell.currentWidget;
        const currentNotebookPath =
          currentWidget && currentWidget instanceof DocumentWidget
            ? currentWidget.context.path
            : '';
        const deployUrl = `/services/japps/create-app?filepath=${encodeURIComponent(currentNotebookPath)}`;

        await openURL(deployUrl);
      },
      label: 'Deploy App',
      icon: args => {
        return calculateIcon(args);
      }
    });
  }
};

const plugins = [jhubAppsPlugin];

export default plugins;
